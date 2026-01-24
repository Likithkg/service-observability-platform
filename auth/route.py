from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm  # ADD THIS
from sqlalchemy.orm import Session
from auth.security import (
    hash_password,
    verify_password,
    create_access_token
)
from auth.dependency import get_current_user
from auth.schema import UserCreate, TokenRes, UserRes  # Remove UserLogin from here
from database.database import get_db
from database.models import User

router = APIRouter()

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
        user.password
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