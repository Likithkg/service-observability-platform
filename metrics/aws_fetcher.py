from datetime import datetime, timedelta, timezone
import boto3


def fetch_metric(region, namespace, metric_name, statistic, dimensions, period):
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
