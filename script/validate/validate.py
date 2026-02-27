import os
import sys
import stat
import platform


def validate_pem(file: str):
    if not os.path.isfile(file) or not file.endswith('.pem'):
        print(f"Please add your .pem file for the vm ssh connection in the cert folder")
        return "File not found"
    
    print("checking for the OS system of machine ...")
    system = platform.system()

    if system == "Windows":
        return "OS not supported"
    
    file_stat = os.stat(file)
    permissions = stat.S_IMODE(file_stat.st_mode)

    if permissions in (0o400, 0o600):
        print("Permissions are secure !")
        return True
    else:
        return False
    