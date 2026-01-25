import time
import threading
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from database.database import Session_local
from database.models import Application
from aws_metrics.aws import collect_ec2_metrics
from helper.encryption import decrypt_value

LATEST_METRICS = {}
POLL_INTERVAL = 30  # seconds - reduced for faster metric updates

def poll_all_applications():
    """
    Continuously poll all active applications for metrics
    """
    global LATEST_METRICS
    
    while True:
        db: Session = Session_local()
        try:
            # Get all active applications
            applications = db.query(Application).filter(
                Application.is_active.is_(True)
            ).all()
            
            for app in applications:
                if app.cloud.lower() == "aws":
                    try:
                        # Decrypt AWS credentials from DB if available
                        aws_access_key_id = None
                        aws_secret_access_key = None
                        
                        if app.aws_access_key_id and app.aws_secret_access_key:
                            try:
                                aws_access_key_id = decrypt_value(app.aws_access_key_id)
                                aws_secret_access_key = decrypt_value(app.aws_secret_access_key)
                            except Exception as decrypt_err:
                                print(f"[Poller] Failed to decrypt credentials for {app.name}: {decrypt_err}")
                                continue
                        
                        metrics = collect_ec2_metrics(
                            instance_id=app.instance_id,
                            region=app.region,
                            agent_installed=True,
                            aws_access_key_id=aws_access_key_id,
                            aws_secret_access_key=aws_secret_access_key
                        )
                        
                        metrics["collected_at"] = datetime.now(timezone.utc).isoformat()
                        metrics["application_id"] = str(app.id)
                        metrics["application_name"] = app.name
                        
                        # Store by application ID
                        LATEST_METRICS[str(app.id)] = metrics
                        print(f"[Poller] Updated metrics for {app.name} ({app.instance_id})")
                        
                    except Exception as e:
                        print(f"[Poller] Error for {app.name}: {e}")
                        LATEST_METRICS[str(app.id)] = {
                            "error": str(e),
                            "collected_at": datetime.now(timezone.utc).isoformat()
                        }
        
        except Exception as e:
            print(f"[Poller] Database error: {e}")
        
        finally:
            db.close()
        
        time.sleep(POLL_INTERVAL)


def start_poller_thread():
    """
    Start the poller in a background thread
    """
    thread = threading.Thread(target=poll_all_applications, daemon=True)
    thread.start()
    print("[Poller] Background metrics collector started")
