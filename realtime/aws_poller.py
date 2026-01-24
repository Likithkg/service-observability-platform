import time
from datetime import datetime, timezone
from metrics.aws_collector import collect_ec2_metrics

# Store metrics per instance
LATEST_METRICS = {}

POLL_INTERVAL = 60  # seconds


def start_ec2_poller(instances: list[dict]):
    """
    instances = [
        {"instance_id": "...", "region": "..."},
        ...
    ]
    """
    global LATEST_METRICS

    while True:
        for inst in instances:
            instance_id = inst["instance_id"]
            region = inst["region"]

            try:
                metrics = collect_ec2_metrics(instance_id, region)
                metrics["collected_at"] = datetime.now(timezone.utc).isoformat()

                LATEST_METRICS[instance_id] = metrics
                print(f"[Poller] Updated {instance_id}")

            except Exception as e:
                print(f"[Poller] Error for {instance_id}: {e}")

        time.sleep(POLL_INTERVAL)
