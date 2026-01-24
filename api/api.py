from fastapi import APIRouter, HTTPException
from realtime.aws_poller import LATEST_METRICS

router = APIRouter(prefix="/metrics", tags=["Metrics"])


@router.get("/ec2/{instance_id}")
def get_ec2_metrics(instance_id: str):
    """
    Get latest metrics for a specific EC2 instance.
    """
    metrics = LATEST_METRICS.get(instance_id)

    if not metrics:
        raise HTTPException(
            status_code=404,
            detail=f"No metrics found for instance {instance_id}"
        )

    return {
        "status": "ok",
        "data": metrics
    }
