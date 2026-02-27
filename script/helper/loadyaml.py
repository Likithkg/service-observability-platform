from pathlib import Path
from os import getenv
from dotenv import load_dotenv
import yaml


load_dotenv()
yaml_name = getenv("YAML_NAME", "")

def getyamlpath() -> Path:
    root  = Path(__file__).resolve().parents[2]
    yaml_path = root / "script" / "cmd"
    if not yaml_path.exists():
        raise FileNotFoundError(f"Cert directory not found: {yaml_path}")
    full_yaml_path =  yaml_path / yaml_name
    if not full_yaml_path.exists():
        raise FileNotFoundError(f"Certificate not found: {full_yaml_path}")
    return full_yaml_path

def loadyaml() -> dict:
    yaml_path = getyamlpath()
    try:
        with open(yaml_path, 'r') as f:
            config = yaml.safe_load(f)
        tasks = config.get("tasks", [])
        command_dict = {task["name"]: task["command"] for task in tasks}
        return command_dict
    except Exception as e:
        raise Exception(f"Failed to load YAML file: {yaml_path}, error: {e}")
