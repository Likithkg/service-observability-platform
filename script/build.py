import os
import sys
import time
from dotenv import load_dotenv

from permission import add_permission
from validate import validate
from getpath import getcertpath
from commands import connect
from helper.loadyaml import loadyaml

load_dotenv()


# -------------------------------------------------
# Execute Command With Live Streaming Logs
# -------------------------------------------------

def execute_command(ssh, command: str, timeout: int = 300, stream: bool = False):
    """
    Execute command on remote VM.
    If stream=True, prints logs live.
    Returns: (exit_code, output, error)
    """

    try:
        stdin, stdout, stderr = ssh.exec_command(command, timeout=timeout)
        channel = stdout.channel

        full_output = []
        full_error = []

        if stream:
            print(f"\n>>> {command}\n")

            while not channel.exit_status_ready():
                if channel.recv_ready():
                    output = channel.recv(1024).decode("utf-8", errors="ignore")
                    print(output, end="")
                    full_output.append(output)

                if channel.recv_stderr_ready():
                    error = channel.recv_stderr(1024).decode("utf-8", errors="ignore")
                    print(error, end="", file=sys.stderr)
                    full_error.append(error)

                time.sleep(0.1)

        exit_code = channel.recv_exit_status()

        remaining_output = stdout.read().decode("utf-8", errors="ignore")
        remaining_error = stderr.read().decode("utf-8", errors="ignore")

        if remaining_output:
            print(remaining_output, end="")
            full_output.append(remaining_output)

        if remaining_error:
            print(remaining_error, end="", file=sys.stderr)
            full_error.append(remaining_error)

        return exit_code, "".join(full_output), "".join(full_error)

    except Exception as e:
        return -1, "", f"Execution error: {str(e)}"


# -------------------------------------------------
# Helper: Replace YAML Placeholders
# -------------------------------------------------

def format_command(command: str, variables: dict) -> str:
    try:
        return command.format(**variables)
    except KeyError as e:
        raise ValueError(f"Missing placeholder variable: {e}")


# -------------------------------------------------
# Helper: Run Step (Non-stream)
# -------------------------------------------------

def run_step(ssh, command, success_msg, fail_msg):
    exit_code, output, error = execute_command(ssh, command)

    if exit_code == 0:
        print(success_msg)
        return True
    else:
        print(fail_msg)
        print(f"Error details: {error}")
        return False


# -------------------------------------------------
# Main Build Logic
# -------------------------------------------------

def build():
    ssh = None

    try:
        print("Starting the build process...\n")

        # STEP 1: Locate Certificate
        print("STEP 1: Locating certificate...")
        cert_path = getcertpath.get_cert_path(os.getenv("CERT_NAME", ""))

        if not cert_path:
            print("FAILED: Certificate not found.")
            return False

        print(f"Certificate found at: {cert_path}\n")

        # STEP 2: Validate Permissions
        print("STEP 2: Validating certificate permissions...")
        validation_result = validate.validate_pem(str(cert_path))

        if validation_result == "OS not supported":
            print("Unsupported OS.")
            return False

        if validation_result == "File not found":
            print("Certificate file missing.")
            return False

        if validation_result is False:
            print("Fixing permissions to 600...")
            if not add_permission.add_permission(str(cert_path)):
                print("Failed to fix permissions.")
                return False
            print("Permissions updated.\n")

        # STEP 3: Connect to VM
        print("STEP 3: Connecting to VM...")
        ssh = connect.vm_connect(str(cert_path))

        if not ssh:
            print("Failed to connect to VM.")
            return False

        print("Connected successfully.\n")

        # Load YAML Commands
        command_dict = loadyaml()

        variables = {
            "branch": os.getenv("GIT_BRANCH", "main"),
            "repo_url": os.getenv("REPO_URL", ""),
            "repo_path": os.getenv("REPO_PATH", ""),
            "image_name": os.getenv("CONTAINER_NAME", ""),
        }

        print("STEP 4: Verifying Git access...")

        git_cmd = format_command(
            str(command_dict.get("check_git_login")),
            variables
        )

        exit_code, output, error = execute_command(ssh, git_cmd)

        combined = (output + error).lower()

        if "successfully authenticated" in combined:
            print("Git authentication successful.\n")
        else:
            print("Git authentication failed.")
            print(error)
            return False

        print("Git access verified.\n")

        # STEP 5: Check Repo / Clone
        print("STEP 5: Checking repository presence...")

        check_repo_cmd = format_command(
            str(command_dict.get("check_repo_cloned")),
            variables
        )

        exit_code, _, _ = execute_command(ssh, check_repo_cmd)

        if exit_code != 0:
            print("Repository not found. Cloning...")

            clone_cmd = format_command(
                str(command_dict.get("clone_repo")),
                variables
            )

            if not run_step(
                ssh,
                clone_cmd,
                "Repository cloned successfully.\n",
                "Clone failed."
            ):
                return False
        else:
            print("Repository already exists.\n")

        # STEP 6: Pull Latest
        print("STEP 6: Pulling latest changes...")

        pull_cmd = format_command(
            str(command_dict.get("pull_latest")),
            variables
        )

        if not run_step(
            ssh,
            pull_cmd,
            "Latest changes pulled.\n",
            "Git pull failed."
        ):
            return False

        # STEP 7: Check Docker
        print("STEP 7: Checking Docker installation...")

        check_docker_cmd = command_dict.get("check_docker")
        exit_code, _, _ = execute_command(ssh, str(check_docker_cmd))

        if exit_code != 0:
            print("Docker not installed. Installing...")

            install_cmd = command_dict.get("install_docker")

            if not run_step(
                ssh,
                install_cmd,
                "Docker installed successfully.\n",
                "Docker installation failed."
            ):
                return False
        else:
            print("Docker already installed.\n")

        # STEP 8: Stop Existing Container
        print("STEP 8: Checking running container...")

        check_container_cmd = format_command(
            str(command_dict.get("check_container")),
            variables
        )

        exit_code, output, _ = execute_command(ssh, check_container_cmd)

        if output.strip():
            print("Container running. Stopping...")

            docker_down_cmd = format_command(
                str(command_dict.get("docker_down")),
                variables
            )

            if not run_step(
                ssh,
                docker_down_cmd,
                "Container stopped.\n",
                "Docker down failed."
            ):
                return False
        else:
            print("No running container found.\n")

        # STEP 9: Build & Start Container (Live Logs)
        print("STEP 9: Building and starting container...\n")

        docker_build_cmd = format_command(
            str(command_dict.get("docker_build")),
            variables
        )

        exit_code, output, error = execute_command(
            ssh,
            docker_build_cmd,
            stream=True
        )

        if exit_code != 0:
            print("Docker build failed.")
            return False

        print("\nContainer built and started successfully.\n")
        return True

    except Exception as e:
        print(f"Unexpected crash: {e}")
        return False

    finally:
        if ssh:
            print("Closing SSH connection...")
            ssh.close()


# -------------------------------------------------
# Entry Point
# -------------------------------------------------

if __name__ == "__main__":
    if build():
        print("\nFINAL STATUS: SUCCESS")
    else:
        print("\nFINAL STATUS: FAILED")