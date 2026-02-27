import os


def add_permission(file: str) -> bool:
    try:
        os.chmod(file, 0o600)
        return True
    except:
        return False