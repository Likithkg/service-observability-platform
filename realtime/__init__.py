import time
from datetime import datetime, timezone
from metrics.aws_collector import collect_ec2_metrics

LATEST_METRICS = {}
POLL_INTERVAL = 60  # seconds


def start_ec2_poller(instance_id: str, region: str):
    global LATEST_METRICS

    while True:
        try:
            metrics = collect_ec2_metrics(instance_id, region)
            metrics["collected_at"] = datetime.now(timezone.utc).isoformat()

            LATEST_METRICS = metrics
            print("[Poller] Metrics updated")

        except Exception as e:
            print("[Poller] Error:", e)

        time.sleep(POLL_INTERVAL)
