# from fastapi import Depends, HTTPException, status
# from fastapi.security import OAuth2PasswordBearer
# from jose import JWTError
# from sqlalchemy.orm import Session
# from uuid import UUID
# from auth.security import decode_access_token
# from database.database import get_db
# from database.models import User

# oauth2_scheme = OAuth2PasswordBearer(tokenUrl='/auth/login')

# def get_current_user(
#     token: str = Depends(oauth2_scheme),
#     db: Session = Depends(get_db)
# ) -> User:
#     """
#     Validate JWT token, fetch user from database,
#     and return the authenticated user.
#     """
#     credential_exception = HTTPException(
#         status_code=status.HTTP_401_UNAUTHORIZED,
#         detail="Could not validate the credentials",
#         headers={"WWW-Authenticate": "Bearer"}
#     )
    
#     try:
#         print(f"type of token {type(token)}")

#         user_id_str = decode_access_token(token)
#         user_id = UUID(user_id_str)  # Convert string to UUID
#     except (JWTError, ValueError) as e:
#         print(f"Token validation error: {e}")  # Debug
#         raise credential_exception
    
#     user = db.query(User).filter(User.id == user_id).first()
    
#     if user is None:
#         print("hi")
#         raise credential_exception
    
#     return user


from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.orm import Session
from uuid import UUID
from auth.security import decode_access_token
from database.database import get_db
from database.models import User

# CHANGE: Remove the leading slash
oauth2_scheme = OAuth2PasswordBearer(tokenUrl='auth/login')  # Changed from '/auth/login'

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    print("=" * 60)
    print("=== GET_CURRENT_USER CALLED ===")
    print(f"=== 1. Token received (first 50 chars): {token[:50] if token else 'NO TOKEN'}...")
    print("=" * 60)
    
    credential_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate the credentials",
        headers={"WWW-Authenticate": "Bearer"}
    )
    
    try:
        user_id_str = decode_access_token(token)
        print(f"=== 2. Decoded user_id_str: {user_id_str}")
        
        user_id = UUID(user_id_str)
        print(f"=== 3. Converted to UUID: {user_id}")
        
    except JWTError as e:
        print(f"=== ERROR: JWT Error: {e}")
        raise credential_exception
    except ValueError as e:
        print(f"=== ERROR: ValueError: {e}")
        raise credential_exception
    except Exception as e:
        print(f"=== ERROR: Unexpected: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        raise credential_exception
    
    user = db.query(User).filter(User.id == user_id).first()
    print(f"=== 4. User found: {user.email if user else 'None'}")
    
    if user is None:
        print("=== ERROR: User not found in database")
        raise credential_exception
    
    print(f"=== 5. SUCCESS - Returning user: {user.email}")
    print("=" * 60)
    return user