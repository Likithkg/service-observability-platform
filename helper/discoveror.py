from pathlib import Path

def read_external_file():
    # Get the absolute path of the current module's directory
    module_dir = Path(__file__).resolve().parent
    
    # Construct the path to the external file
    # Go up one level (..) from module_dir to project_root, then into 'data' folder
    file_path = module_dir.parent / 'config' / 'metrics.yaml'
    
    return file_path

