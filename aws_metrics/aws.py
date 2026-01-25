from datetime import datetime, timezone
from typing import Optional
from helper.yamlLoader import load_metrics_config
from aws_metrics.aws_fetcher import fetch_metric


def collect_ec2_metrics(
    instance_id: str, 
    region: str, 
    agent_installed: bool = False,
    aws_access_key_id: Optional[str] = None,
    aws_secret_access_key: Optional[str] = None
):
    config = load_metrics_config()
    aws_config = config["aws"]

    results = {
        "instance_id": instance_id,
        "region": region,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

    # ---------------- EC2 NATIVE METRICS ----------------
    for metric_key, metric_def in aws_config.get("ec2", {}).items():
        dimensions = [{"Name": "InstanceId", "Value": instance_id}]

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

    # ---------------- CWAGENT METRICS ----------------
    for metric_key, metric_def in aws_config.get("cwagent", {}).items():

        # Respect requires_agent flag
        if metric_def.get("requires_agent") and not agent_installed:
            results[metric_key] = None
            continue

        dimensions = [{"Name": "InstanceId", "Value": instance_id}]

        # Disk metrics require extra dimensions
        if metric_def["metric_name"].startswith("disk"):
            dimensions.extend([
                {"Name": "path", "Value": "/"},
                {"Name": "fstype", "Value": "xfs"}  # adjust if needed
            ])

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
