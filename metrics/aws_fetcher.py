from datetime import datetime, timedelta, timezone
from typing import Optional
import boto3


def fetch_metric(region, namespace, metric_name, statistic, dimensions, period, aws_access_key_id: Optional[str] = None, aws_secret_access_key: Optional[str] = None):
    # Create CloudWatch client with provided credentials if available
    if aws_access_key_id and aws_secret_access_key:
        cloudwatch = boto3.client(
            "cloudwatch",
            region_name=region,
            aws_access_key_id=aws_access_key_id,
            aws_secret_access_key=aws_secret_access_key
        )
    else:
        # Use default credentials (from environment or ~/.aws)
        cloudwatch = boto3.client("cloudwatch", region_name=region)

    end_time = datetime.now(timezone.utc)
    start_time = end_time - timedelta(minutes=15)

    response = cloudwatch.get_metric_statistics(
        Namespace=namespace,
        MetricName=metric_name,
        Dimensions=dimensions,
        StartTime=start_time,
        EndTime=end_time,
        Period=period,
        Statistics=[statistic],
    )

    datapoints = response.get("Datapoints", [])
    if not datapoints:
        return None

    latest = max(datapoints, key=lambda x: x["Timestamp"])
    return latest.get(statistic)
