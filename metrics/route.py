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

router = APIRouter(tags=["metrics"])

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
                # Check collector type and format accordingly
                if application.collector_type == "s3":
                    formatted = {
                        "timestamp": metrics.get("collected_at"),
                        "bucket_size_bytes": metrics.get("bucket_size_bytes", 0) or 0,
                        "number_of_objects": metrics.get("number_of_objects", 0) or 0,
                        "error": metrics.get("error")
                    }
                else:  # EC2 - REPLACE THE OLD formatted DICTIONARY WITH THIS
                    formatted = {
                        "timestamp": metrics.get("collected_at"),
                        "cpu": metrics.get("cpu_utilization", 0) or 0,
                        "memory": metrics.get("memory_used_percent", 0) or 0,
                        "network_in": (metrics.get("network_in_bytes", 0) or 0) / (1024 * 1024),
                        "network_out": (metrics.get("network_out_bytes", 0) or 0) / (1024 * 1024),
                        "network": ((metrics.get("network_in_bytes", 0) or 0) + (metrics.get("network_out_bytes", 0) or 0)) / (1024 * 1024),
                        "disk": metrics.get("disk_used_percent", 0) or 0,
                        "error": metrics.get("error")
                    }
                
                # Send as SSE
                yield f"data: {json.dumps(formatted)}\n\n"
            
            await asyncio.sleep(5)
    # Send updates every 5 seconds

    
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
    
    # Format response based on collector type
    if application.collector_type == "s3":
        formatted = {
            "bucket_size_bytes": metrics.get("bucket_size_bytes", 0) or 0,
            "number_of_objects": metrics.get("number_of_objects", 0) or 0
        }
    else:
        formatted = {
            "cpu": metrics.get("cpu_utilization", 0) or 0,
            "memory": metrics.get("memory_used_percent", 0) or 0,
            "network": (
                (metrics.get("network_in_bytes", 0) or 0) + 
                (metrics.get("network_out_bytes", 0) or 0)
            ) / (1024 * 1024),
            "disk": metrics.get("disk_used_percent", 0) or 0
        }
    
    # Format response
    return {
        "application_id": str(app_id),
        "timestamp": metrics.get("collected_at"),
        "metrics": metrics,
        "formatted": formatted  # <-- This now uses the conditional formatting above
    }
