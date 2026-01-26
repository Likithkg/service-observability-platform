from datetime import datetime, timezone
from typing import Optional
from helper.yamlLoader import load_metrics_config
from metrics.aws_S3_fetcher import fetch_S3_metrics

def collect_S3_metrics(
        bucket_name: str,
        region: str,
        aws_access_key_id: Optional[str] = None,
        aws_secret_access_key: Optional[str] = None,
):
    config = load_metrics_config()
    aws_config = config["aws"]
    results = {
        "bucket_name": bucket_name,
        "region": region,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    # ---------------- S3 NATIVE METRICS ----------------
    for metric_key, metric_def in aws_config.get("s3", {}).items():
        dimensions = [{"Name": "BucketName", "Value": bucket_name}]
        value = fetch_S3_metrics(
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