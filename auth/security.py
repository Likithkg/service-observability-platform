from datetime import datetime, timedelta, UTC
from typing import Optional
from jose import JWTError, jwt
from os import getenv
from dotenv import load_dotenv

import bcrypt

SECRET_KEY = getenv('SECRET_KEY')
ALGORITHM = getenv('ALGORITHM')
ACCESS_TOKEN_EXPIRE_MIN = 30

def hash_pssword(password: str) -> str:
    """This function hashes the password to be stored in db"""
    password_byts = password.encode("utf-8")
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(password_byts, salt)
    return hashed_password.decode("utf-8")

def verify_password(plain_psswd: str, hashed_psswd: str)->bool:
    """Verify plain password against bcrypt password"""
    return bcrypt.checkpw(
        plain_psswd.encode("utf-8"),
        hashed_psswd.encode("utf-8")
    )

def create_access_token(subject: str, expires_delta: Optional[timedelta] = None) -> str:
    """
    Creates a JWT token
    Subject should be the user_id (UUID as string)
    """
    if expires_delta:
        expire = datetime.now(UTC) + expires_delta
    else:
        expire = datetime.now(UTC) + timedelta(
            minutes=ACCESS_TOKEN_EXPIRE_MIN
        )
    payload = {
        "sub": subject,
        "exp": expire
    }
    encoded_jwt = jwt.encode(
        payload,
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
    payload = jwt.decode(
        token,
        SECRET_KEY,
        algorithms=[ALGORITHM]
    )

    subject = payload.get("sub")
    if subject is None:
        raise JWTError("Token payload missing subject")

    return subject


