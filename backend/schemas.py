from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict
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

# -----------------
# Exam Schemas
# -----------------
class QuestionResponse(BaseModel):
    id: int
    content: str
    options: Dict[str, str]

    class Config:
        from_attributes = True

class ExamResponse(BaseModel):
    id: int
    title: str
    questions: List[QuestionResponse]

    class Config:
        from_attributes = True

class AnswerItem(BaseModel):
    question_id: int
    answer: str

class SubmitResponse(BaseModel):
    score: float
    correct: int
    total: int
