import paramiko
from os import getenv
from dotenv import load_dotenv


load_dotenv()

def vm_connect(cert_path: str):
    try:
        pkey = paramiko.RSAKey.from_private_key_file(cert_path)
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

        ssh.connect(
            hostname=getenv("HOST_IP", ""),
            username=getenv("HOST_NAME", ""),
            pkey=pkey,
            timeout=10,
            port=int(getenv("SSH_PORT", 22))
        )

        return ssh
    except Exception as e:
        print(f"Failed to connect to the VM: {e}")
        return False
