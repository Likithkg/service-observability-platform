from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from uuid import UUID
import json
import asyncio

from database.database import get_db
from auth.dependency import get_current_user, get_current_user_from_query
from database.models import User, Application
from realtime.aws_poller import LATEST_METRICS

# Import S3 collector
from aws_metrics.s3 import collect_s3_metrics

router = APIRouter(tags=["metrics"])

# ============================================
# EC2 ENDPOINTS (Existing - Not Modified)
# ============================================

@router.get("/{app_id}/realtime")
async def stream_realtime_metrics(
    app_id: UUID,
    current_user: User = Depends(get_current_user_from_query),
    db: Session = Depends(get_db)
):
    """
    Stream real-time metrics using Server-Sent Events (SSE)
    """
    # Verify application belongs to user
    application = db.query(Application).filter(
        Application.id == app_id,
        Application.user_id == current_user.id,
        Application.is_active.is_(True)
    ).first()
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
    
    async def event_generator():
        """Generate SSE events"""
        while True:
            # Get latest metrics for this application
            metrics = LATEST_METRICS.get(str(app_id), {})
            
            if metrics:
                # Format metrics for frontend
                formatted = {
                    "timestamp": metrics.get("collected_at"),
                    "cpu": metrics.get("cpu_utilization", 0) or 0,
                    "memory": metrics.get("memory_used_percent", 0) or 0,
                    "network_in": (metrics.get("network_in_bytes", 0) or 0) / (1024 * 1024),
                    "network_out": (metrics.get("network_out_bytes", 0) or 0) / (1024 * 1024),
                    "disk": metrics.get("disk_used_percent", 0) or 0,
                    "error": metrics.get("error")
                }
                
                # Send as SSE
                yield f"data: {json.dumps(formatted)}\n\n"
            
            await asyncio.sleep(5)  # Send updates every 5 seconds
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


@router.get("/{app_id}")
def get_latest_metrics(
    app_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get the latest metrics snapshot for an application
    """
    # Verify application belongs to user
    application = db.query(Application).filter(
        Application.id == app_id,
        Application.user_id == current_user.id,
        Application.is_active.is_(True)
    ).first()
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
    
    # Get latest metrics
    metrics = LATEST_METRICS.get(str(app_id), {})
    
    if not metrics:
        return {
            "message": "No metrics available yet",
            "application_id": str(app_id)
        }
    
    # Format response
    return {
        "application_id": str(app_id),
        "timestamp": metrics.get("collected_at"),
        "metrics": {
            "cpu_utilization": metrics.get("cpu_utilization"),
            "cpu_max": metrics.get("cpu_max"),
            "memory_used_percent": metrics.get("memory_used_percent"),
            "network_in_bytes": metrics.get("network_in_bytes"),
            "network_out_bytes": metrics.get("network_out_bytes"),
            "disk_used_percent": metrics.get("disk_used_percent"),
            "cpu_credit_balance": metrics.get("cpu_credit_balance"),
            "status_failed_system": metrics.get("status_failed_system")
        },
        "formatted": {
            "cpu": metrics.get("cpu_utilization", 0) or 0,
            "memory": metrics.get("memory_used_percent", 0) or 0,
            "network": (
                (metrics.get("network_in_bytes", 0) or 0) + 
                (metrics.get("network_out_bytes", 0) or 0)
            ) / (1024 * 1024),
            "disk": metrics.get("disk_used_percent", 0) or 0
        }
    }


# ============================================
# S3 ENDPOINTS (NEW - Free Tier Only)
# ============================================

@router.get("/{app_id}/s3")
def get_s3_metrics(
    app_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get S3 bucket metrics (FREE tier - storage metrics only)
    
    Returns:
    - Bucket size (updated daily by AWS)
    - Object count (updated daily by AWS)
    
    Note: Only FREE storage metrics are collected to avoid CloudWatch charges.
    """
    # Verify application belongs to user and is S3
    application = db.query(Application).filter(
        Application.id == app_id,
        Application.user_id == current_user.id,
        Application.is_active.is_(True)
    ).first()
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
    
    # Check if it's an S3 application
    if application.service_type != 'S3':
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"This endpoint is for S3 buckets only. Application type is: {application.service_type}"
        )
    
    try:
        # Get AWS credentials
        credentials = application.get_aws_credentials()
        
        if not credentials.get('access_key_id'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No AWS credentials configured for this bucket"
            )
        
        # Collect FREE S3 metrics
        metrics = collect_s3_metrics(
            bucket_name=application.bucket_name,
            region=application.region,
            aws_access_key_id=credentials['access_key_id'],
            aws_secret_access_key=credentials['secret_access_key']
        )
        
        # Helper function for safe numeric values
        def safe_value(value, default=0):
            return value if value is not None else default
        
        bucket_size = safe_value(metrics.get('bucket_size_bytes'))
        object_count = safe_value(metrics.get('number_of_objects'))
        
        # Format response
        response = {
            "application_id": str(app_id),
            "bucket_name": metrics['bucket_name'],
            "region": metrics['region'],
            "timestamp": metrics['timestamp'],
            
            # Storage metrics (FREE - updated daily)
            "storage": {
                "size_bytes": bucket_size,
                "size_mb": round(bucket_size / (1024**2), 2),
                "size_gb": round(bucket_size / (1024**3), 2),
                "object_count": int(object_count)
            },
            
            # Formatted for display
            "formatted": {
                "size": f"{round(bucket_size / (1024**3), 2)} GB",
                "objects": f"{int(object_count):,}",
                "size_per_object": f"{round(bucket_size / max(object_count, 1) / 1024, 2)} KB" if object_count > 0 else "N/A"
            },
            
            "note": "FREE tier metrics only. Storage data updated daily by AWS."
        }
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch S3 metrics: {str(e)}"
        )


@router.get("/{app_id}/s3/snapshot")
def get_s3_snapshot(
    app_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a quick snapshot of S3 bucket metrics
    (Same as /s3 but with simplified response)
    """
    # Verify application
    application = db.query(Application).filter(
        Application.id == app_id,
        Application.user_id == current_user.id,
        Application.is_active.is_(True),
        Application.service_type == 'S3'
    ).first()
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="S3 bucket not found"
        )
    
    try:
        credentials = application.get_aws_credentials()
        
        if not credentials.get('access_key_id'):
            return {
                "application_id": str(app_id),
                "message": "No AWS credentials configured",
                "bucket_name": application.bucket_name,
                "region": application.region
            }
        
        # Collect metrics
        metrics = collect_s3_metrics(
            bucket_name=application.bucket_name,
            region=application.region,
            aws_access_key_id=credentials['access_key_id'],
            aws_secret_access_key=credentials['secret_access_key']
        )
        
        def safe_value(value, default=0):
            return value if value is not None else default
        
        bucket_size = safe_value(metrics.get('bucket_size_bytes'))
        object_count = safe_value(metrics.get('number_of_objects'))
        
        # Simple snapshot response
        return {
            "application_id": str(app_id),
            "bucket_name": application.bucket_name,
            "region": application.region,
            "timestamp": metrics['timestamp'],
            "size_gb": round(bucket_size / (1024**3), 2),
            "object_count": int(object_count),
            "status": "active"
        }
        
    except Exception as e:
        return {
            "application_id": str(app_id),
            "bucket_name": application.bucket_name,
            "region": application.region,
            "error": str(e),
            "status": "error"
        }