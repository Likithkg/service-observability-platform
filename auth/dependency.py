from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.orm import Session

from auth.security import decode_access_token
from database.database import get_db
from database.models import User

oauth2_schema = OAuth2PasswordBearer(tokenUrl='/auth/login')

def get_current_user(
    token: str = Depends(oauth2_schema),
    db: Session = Depends(get_db)
) -> User:
    """
    Validate JWT token, fetch user from database,
    and return the authenticated user.
    """
    credential_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate the credentials",
        headers={"WWW-Authenticate":"Bearer"}
    )
    try:
        user_id = decode_access_token(token)
    except JWTError:
        raise credential_exception
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credential_exception
    return user