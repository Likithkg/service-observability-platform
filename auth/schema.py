from pydantic import BaseModel, EmailStr, ConfigDict
from uuid import UUID
from datetime import datetime

class UserCreate(BaseModel):
    email: EmailStr
    password: str  # Make sure this is "password" not "psswrd"

class UserLogin(BaseModel):
    email: EmailStr
    password: str  # Make sure this is "password" not "psswrd"

class TokenRes(BaseModel):
    access_token: str
    token_type: str

class UserRes(BaseModel):
    id: UUID
    email: str
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class ForgotPasswordReq(BaseModel):
    email: EmailStr

class ResetPaswordReq(BaseModel):
    token: str
    new_passowrd: str