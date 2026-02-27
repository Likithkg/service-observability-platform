import sys
import time

def execute_command(ssh, command: str, timeout: int = 300, stream: bool = True):
    """
    Execute command on remote VM.
    If stream=True, prints live output.
    Returns: (exit_code, full_output, full_error)
    """

    try:
        stdin, stdout, stderr = ssh.exec_command(command, timeout=timeout)

        channel = stdout.channel

        full_output = []
        full_error = []

        if stream:
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

        # Read remaining output after command completes
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