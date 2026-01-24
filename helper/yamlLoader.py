import yaml
from pathlib import Path
from helper.discoveror import read_external_file


def load_metrics_config():
    file_path = read_external_file()
    path = Path(file_path)
    with open(path, "r") as f:
        return yaml.safe_load(f)
    
