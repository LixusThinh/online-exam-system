from pydantic import BaseModel, EmailStr
from typing import Optional
from models.user import UserRole

# -----------------
# Token Schemas
# -----------------
class Token(BaseModel):
    access_token: str
    token_type: str
    user: 'UserResponse'

class TokenData(BaseModel):
    username: Optional[str] = None

# -----------------
# User Schemas
# -----------------
class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: Optional[str] = None
    role: UserRole = UserRole.STUDENT

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    is_active: bool
    is_admin: bool

    class Config:
        from_attributes = True
