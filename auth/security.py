

from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta, timezone
from typing import Optional
import os
import secrets

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

# JWT Configuration

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY environment variable is not set!")
ALGORITHM = os.getenv("ALGORITHM", "HS256")  # Default to HS256
ACCESS_TOKEN_EXPIRE_MINUTES = 30



def hash_password(password: str) -> str:
    """Hash a password using Argon2"""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash using Argon2"""
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(subject: str, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token"""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode = {"exp": expire, "sub": subject}

    if not SECRET_KEY:
        raise RuntimeError("SECRET_KEY environment variable is not set!")
    encoded_jwt = jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM
    )
    return encoded_jwt

def decode_access_token(token: str) -> str:
    """
    Decode and validate a JWT access token.
    Returns the `sub` (user_id) if valid.
    Raises JWTError if invalid or expired.
    """
    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )
        subject = payload.get("sub")
        if subject is None:
            raise JWTError("Token payload missing subject")
        return subject
    except JWTError as e:
        raise JWTError(f"Invalid token: {str(e)}")
    

def generateResetToken():
    return secrets.token_urlsafe(32)


def getResetTokenExpire():
    return datetime.now(timezone.utc) + timedelta(minutes=30)
