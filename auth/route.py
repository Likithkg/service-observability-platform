from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from auth.security import (
    hash_pssword,
    verify_password,
    create_access_token
)

from auth.dependency import get_current_user
from auth.schema import UserCreate, UserLogin, TokenRes, UserRes
from database.database import get_db
from database.models import User

router = APIRouter()

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register_user(
    user_in: UserCreate,
    db: Session = Depends(get_db)
):
    # Check if the user exists in the db
    existing_user = (
        db.query(User)
        .filter(User.email == user_in.email)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already Exists. Try loging in"
        )
    hash_psswrd = hash_pssword(user_in.psswrd)
    user = User(
        email = user_in.email,
        password = hash_psswrd
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"message":"User Registred Successfully"}

@router.post("/login", response_model=TokenRes)
def login(
    user_in: UserLogin,
    db: Session = Depends(get_db)
):
    user = (
        db.query(User)
        .filter(User.email == user_in.email)
        .first()
    )

    if not user or not verify_password(
        user_in.psswrd,
        User.password
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            details="Entereed Password or User Name is Invalid"
        )
    access_token = create_access_token(subject=str(user.id))

    return TokenRes(
        access_token=access_token,
        token_type="bearer"
    )

@router.get("/me", response_model= UserRes)
def read_current_user(
    current_user: User = Depends(get_current_user)
):
    return current_user