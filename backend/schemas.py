from pydantic import BaseModel, EmailStr
from typing import Optional, List
from models import UserRole

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
    full_name: Optional[str] = None
    role: UserRole = UserRole.STUDENT

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
   

    class Config:
        from_attributes = True

# -----------------
# Quiz (Exam) Schemas
# -----------------
class QuizBase(BaseModel):
    title: str
    time_limit: Optional[int] = None
    password: Optional[str] = None
    class_id: Optional[int] = None

class QuizCreate(QuizBase):
    pass

class QuizUpdate(BaseModel):
    title: Optional[str] = None
    time_limit: Optional[int] = None
    password: Optional[str] = None
    class_id: Optional[int] = None

class QuestionResponse(BaseModel):
    id: int
    content: str
    points: float

    class Config:
        from_attributes = True

class QuizResponse(QuizBase):
    id: int
    teacher_id: int
    questions: List[QuestionResponse] = []

    class Config:
        from_attributes = True

# -----------------
# Submission (Nộp bài / Chấm điểm) Schemas
# -----------------
class SubmitAnswer(BaseModel):
    question_id: int
    choice_id: int

class SubmitExamRequest(BaseModel):
    answers: List[SubmitAnswer]

class SubmitResponse(BaseModel):
    score: float
    total_points: float
    status: str
    message: str
