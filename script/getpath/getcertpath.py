from pathlib import Path

def get_project_root() -> Path:
    """
    Dynamically locate the project root directory.
    Assumes this file is inside:
    project_root/script/getpath/
    """
    return Path(__file__).resolve().parents[2]


def get_cert_path(cert_name: str) -> Path:
    root = get_project_root()
    cert_dir = root / "script" / "cert"

    if not cert_dir.exists():
        raise FileNotFoundError(f"Cert directory not found: {cert_dir}")

    cert_path = cert_dir / cert_name

    if not cert_path.exists():
        raise FileNotFoundError(f"Certificate not found: {cert_path}")

    return cert_path

