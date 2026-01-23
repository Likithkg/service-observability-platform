from pydantic import BaseModel, EmailStr, Field
from uuid import UUID

class UserCreate(BaseModel):
    """Schema for user registration request"""

    email: EmailStr
    password: str = Field(min_length=8)

class UserLogin(BaseModel):
    """Schema for user login"""

    email: EmailStr
    password: str

class TokenRes(BaseModel):
    """Schema for JWT Token response"""

    id: UUID
    email: EmailStr

    class Config:
        orm_mode = True