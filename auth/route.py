from fastapi import Response, Request
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm  # ADD THIS
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from datetime import datetime
from auth.security import (
    hash_password,
    verify_password,
    create_access_token,
    generateResetToken,
    getResetTokenExpire
)
from auth.dependency import get_current_user
from auth.schema import UserCreate, TokenRes, UserRes, ForgotPasswordReq, ResetPaswordReq  # Remove UserLogin from here
from database.database import get_db
from database.models import User

router = APIRouter()
pwd_context = CryptContext(schemes = ["bcrypt"], deprecated="auto")

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register_user(
    user_in: UserCreate,
    db: Session = Depends(get_db)
):
    existing_user = (
        db.query(User)
        .filter(User.email == user_in.email)
        .first()
    )
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already exists. Try logging in"
        )
    
    hashed_password = hash_password(user_in.password)
    
    user = User(
        email=user_in.email,
        password=hashed_password
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return {"message": "User registered successfully"}

# CHANGE THIS ENDPOINT - Use OAuth2PasswordRequestForm
@router.post("/login", response_model=TokenRes)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),  # CHANGED
    db: Session = Depends(get_db)
):
    # OAuth2 uses 'username' field, we treat it as email
    user = (
        db.query(User)
        .filter(User.email == form_data.username)  # CHANGED
        .first()
    )
    
    if not user or not verify_password(
        form_data.password,  # CHANGED
        str(getattr(user, 'password')) if user and getattr(user, 'password', None) is not None else ''
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Entered password or username is invalid",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    access_token = create_access_token(subject=str(user.id))
    
    return TokenRes(
        access_token=access_token,
        token_type="bearer"
    )

@router.get("/me", response_model=UserRes)
def read_current_user(
    current_user: User = Depends(get_current_user)
):
    return current_user

@router.post("/forgot-password", status_code=status.HTTP_200_OK)
def forgotPassword(request: Request, body: ForgotPasswordReq, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user:
        raise HTTPException(
            status_code = status.HTTP_404_NOT_FOUND,
            detail = "The user not found regester first!"
        )
    token = generateResetToken()
    setattr(user, 'reset_token', token)
    setattr(user, 'reset_token_expire', getResetTokenExpire())
    db.commit()
    # Return the token directly for frontend redirect
    return {"token": token, "message": "Token generated. Redirect user to reset page."}

@router.post("/reset-password", status_code=status.HTTP_202_ACCEPTED)
def resetPassword(request: ResetPaswordReq, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.reset_token == request.token).first()
    if not user:
        raise HTTPException(
            status_code = status.HTTP_401_UNAUTHORIZED,
            detail = "Unauthorized\n\nInvalid token"
        )
    
    if getattr(user, 'reset_token_expire') and getattr(user, 'reset_token_expire') < datetime.utcnow():
        raise HTTPException(
            status_code = status.HTTP_401_UNAUTHORIZED,
            detail = "The token has expired try again"
        )
    # Update password and clear reset token
    setattr(user, 'password', hash_password(request.new_passowrd))
    setattr(user, 'reset_token', None)
    setattr(user, 'reset_token_expire', None)
    db.commit()
    return {"message": "Password reset successful. You can now log in with your new password."}

# Debug endpoint: List all users in the observability.users table
@router.get("/debug-list-users", tags=["Debug"])
def debug_list_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return [{
        "id": str(u.id),
        "email": u.email,
        "created_at": str(u.created_at)
    } for u in users]


