# from passlib.context import CryptContext
# from jose import jwt, JWTError
# from datetime import datetime, timedelta
# import os

# # Use Argon2 instead of bcrypt
# pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

# # JWT Configuration
# SECRET_KEY = os.getenv("SECRET_KEY")
# ALGORITHM = os.getenv("ALGORITHM")
# ACCESS_TOKEN_EXPIRE_MINUTES = 30

# def hash_password(password: str) -> str:
#     """Hash a password using Argon2"""
#     return pwd_context.hash(password)

# def verify_password(plain_password: str, hashed_password: str) -> bool:
#     """Verify a password against its hash using Argon2"""
#     return pwd_context.verify(plain_password, hashed_password)

# def create_access_token(subject: str, expires_delta: timedelta = None) -> str:
#     """Create a JWT access token"""
#     if expires_delta:
#         expire = datetime.utcnow() + expires_delta
#     else:
#         expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
#     to_encode = {"exp": expire, "sub": subject}
#     encoded_jwt = jwt.encode(
#         to_encode,
#         SECRET_KEY,
#         algorithm=ALGORITHM
#     )
#     return encoded_jwt

# def decode_access_token(token: str) -> str:
#     """
#     Decode and validate a JWT access token.
#     Returns the `sub` (user_id) if valid.
#     Raises JWTError if invalid or expired.
#     """
#     try:
#         payload = jwt.decode(
#             token,
#             SECRET_KEY,
#             algorithms=[ALGORITHM]
#         )
#         subject = payload.get("sub")
#         if subject is None:
#             raise JWTError("Token payload missing subject")
#         return subject
#     except JWTError as e:
#         raise JWTError(f"Invalid token: {str(e)}")

from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta
import os

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

# JWT Configuration
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")  # Default to HS256
ACCESS_TOKEN_EXPIRE_MINUTES = 30

print(f"=== CONFIG: SECRET_KEY exists: {SECRET_KEY is not None}")
print(f"=== CONFIG: ALGORITHM: {ALGORITHM}")

def hash_password(password: str) -> str:
    """Hash a password using Argon2"""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash using Argon2"""
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(subject: str, expires_delta: timedelta = None) -> str:
    """Create a JWT access token"""
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {"exp": expire, "sub": subject}
    print(f"=== Creating token for subject: {subject}")
    
    encoded_jwt = jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM
    )
    print(f"=== Token created: {encoded_jwt[:50]}...")
    return encoded_jwt

def decode_access_token(token: str) -> str:
    """
    Decode and validate a JWT access token.
    Returns the `sub` (user_id) if valid.
    Raises JWTError if invalid or expired.
    """
    print(f"=== Decoding token: {token[:50]}...")
    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )
        print(f"=== Payload decoded: {payload}")
        subject = payload.get("sub")
        if subject is None:
            raise JWTError("Token payload missing subject")
        print(f"=== Subject extracted: {subject}")
        return subject
    except JWTError as e:
        print(f"=== Decode error: {e}")
        raise JWTError(f"Invalid token: {str(e)}")
