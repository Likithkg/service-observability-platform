from datetime import datetime, timezone
from typing import Optional
from helper.yamlLoader import load_metrics_config
from aws_metrics.aws_fetcher import fetch_metric


def collect_s3_metrics(
    bucket_name: str,
    region: str,
    aws_access_key_id: Optional[str] = None,
    aws_secret_access_key: Optional[str] = None
):
    """
    Collect FREE S3 bucket metrics from AWS CloudWatch.
    
    FREE TIER NOTES:
    - Only BucketSizeBytes and NumberOfObjects are collected (these are FREE)
    - Request metrics (AllRequests, GetRequests, etc.) are NOT collected as they cost money
    - CloudWatch API calls are free for basic monitoring metrics
    
    Args:
        bucket_name: Name of the S3 bucket
        region: AWS region where the bucket is located
        aws_access_key_id: AWS access key (optional)
        aws_secret_access_key: AWS secret key (optional)
    
    Returns:
        Dictionary containing FREE S3 metrics only
    """
    config = load_metrics_config()
    aws_config = config["aws"]
    
    results = {
        "bucket_name": bucket_name,
        "region": region,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    
    # ---------------- S3 FREE METRICS ONLY ----------------
    # These metrics are provided by AWS at no cost
    for metric_key, metric_def in aws_config.get("s3", {}).items():
        # Build dimensions based on metric type
        if metric_def["metric_name"] == "BucketSizeBytes":
            dimensions = [
                {"Name": "BucketName", "Value": bucket_name},
                {"Name": "StorageType", "Value": "StandardStorage"}
            ]
        elif metric_def["metric_name"] == "NumberOfObjects":
            dimensions = [
                {"Name": "BucketName", "Value": bucket_name},
                {"Name": "StorageType", "Value": "AllStorageTypes"}
            ]
        else:
            # Skip any other metrics (they cost money)
            continue
        
        # Fetch the metric value
        value = fetch_metric(
            region=region,
            namespace=metric_def["namespace"],
            metric_name=metric_def["metric_name"],
            statistic=metric_def["statistic"],
            dimensions=dimensions,
            period=metric_def["period"],
            aws_access_key_id=aws_access_key_id,
            aws_secret_access_key=aws_secret_access_key
        )
        
        results[metric_key] = value
    
    return results