import smtplib
from email.message import EmailMessage
import os
from dotenv import load_dotenv

load_dotenv()

def sendResetLink(to_email: str, reset_link: str):
    admin_email = os.getenv("ADMIN_EMAIL")
    admin_password = os.getenv("ADMIN_EMAIL_PASSWORD")
    if not (admin_email and admin_password):
        raise RuntimeError("Missing required environment variables for email sending.")
    msg = EmailMessage()
    msg["Subject"] = "Password Reset Request"
    msg["From"] = admin_email
    msg["To"] = to_email
    msg.set_content(
        f"Hey!\nThis email is regarding the password reset request that you have submitted.\n"
        f"Please click on this link to reset your password:\n\n{reset_link}\n\n"
        f"If not initiated by you, please ignore this email.\n\nThanks and regards,\nadmin\n\n"
        f"========================================================================\n"
        f"This is a system generated email.\nPlease do not reply."
    )
    # Use SMTP_SSL for port 465
    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.set_debuglevel(1)
        server.login(admin_email, admin_password)
        server.send_message(msg)
