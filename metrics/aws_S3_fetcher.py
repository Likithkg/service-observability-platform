from datetime import datetime, timezone, timedelta
from typing import Optional
import boto3

def fetch_S3_metrics(region, namespace, metric_name, statistic, dimensions, period, aws_access_key_id: Optional[str] = None, aws_secret_access_key: Optional[str] = None):
    if aws_access_key_id and aws_secret_access_key:
        S3_client = boto3.client(
            's3',
            aws_access_key_id=aws_access_key_id,
            aws_secret_access_key=aws_secret_access_key,
            region_name=region
        )
        cloudwatcher = boto3.client(
            "cloudwatch",
            region_name=region,
            aws_access_key_id=aws_access_key_id,
            aws_secret_access_key=aws_secret_access_key
        )
    else:
        S3_client = boto3.client('s3', region_name=region)
        cloudwatcher = boto3.client("cloudwatch", region_name=region)
    
    end_time = datetime.now(timezone.utc)
    start_time = end_time - timedelta(days=7)

    response = cloudwatcher.get_metric_statistics(
        Namespace=namespace,  # Changed from NameSpace
        MetricName=metric_name,
        Dimensions=dimensions,
        StartTime=start_time,
        EndTime=end_time,
        Period=period,
        Statistics=[statistic],
    )


    Datapoints = response.get("Datapoints", [])
    if not Datapoints:
        return None
    latest = max(Datapoints, key=lambda x: x["Timestamp"])
    return latest.get(statistic)