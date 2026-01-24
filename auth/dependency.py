from fastapi import Depends, HTTPException, status, Query
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.orm import Session
from uuid import UUID
from auth.security import decode_access_token
from database.database import get_db
from database.models import User

# CHANGE: Remove the leading slash
oauth2_scheme = OAuth2PasswordBearer(tokenUrl='auth/login')

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:

    
    credential_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate the credentials",
        headers={"WWW-Authenticate": "Bearer"}
    )
    
    try:
        user_id_str = decode_access_token(token)
        
        user_id = UUID(user_id_str)
        
    except JWTError as e:
        raise credential_exception
    except ValueError as e:
        raise credential_exception
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise credential_exception
    
    user = db.query(User).filter(User.id == user_id).first()
    
    if user is None:
        raise credential_exception
    
    return user


def get_current_user_from_query(
    token: str = Query(...),
    db: Session = Depends(get_db)
) -> User:
    """
    Get current user from token passed as query parameter (for WebSocket/SSE)
    """
    credential_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate the credentials",
        headers={"WWW-Authenticate": "Bearer"}
    )
    
    try:
        user_id_str = decode_access_token(token)
        user_id = UUID(user_id_str)
        
    except JWTError as e:
        raise credential_exception
    except ValueError as e:
        raise credential_exception
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise credential_exception
    
    user = db.query(User).filter(User.id == user_id).first()
    
    if user is None:
        raise credential_exception
    
    return user
