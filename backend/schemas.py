from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

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
    role: str = "student"
    permissions: List[str] = []

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int

    class Config:
        from_attributes = True

# -----------------
# Class (Lớp học) Schemas
# -----------------
class ClassCreate(BaseModel):
    name: str
    invite_code: Optional[str] = None  # Nếu không truyền thì auto-gen

class ClassResponse(BaseModel):
    id: int
    name: str
    invite_code: str
    teacher_id: int

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

# -----------------
# Choice & Question Schemas
# -----------------
class ChoiceCreate(BaseModel):
    content: str
    is_correct: bool = False

class ChoiceResponse(BaseModel):
    id: int
    content: str
    is_correct: bool

    class Config:
        from_attributes = True

class QuestionCreate(BaseModel):
    content: str
    points: float = 1.0
    choices: List[ChoiceCreate]

class QuestionResponse(BaseModel):
    id: int
    content: str
    points: float
    choices: List[ChoiceResponse] = []

    class Config:
        from_attributes = True

class ChoiceUpdate(BaseModel):
    id: Optional[int] = None
    content: str
    is_correct: bool = False

class QuestionUpdate(BaseModel):
    content: Optional[str] = None
    points: Optional[float] = None
    choices: Optional[List[ChoiceUpdate]] = None

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
    cheat_count: int = 0

class SubmitResponse(BaseModel):
    score: float
    total_points: float
    status: str
    message: str
    cheat_count: int = 0

class SubmissionResponse(BaseModel):
    id: int
    quiz_id: int
    student: UserResponse
    score: Optional[float] = None
    status: str
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None
    cheat_count: int = 0

    class Config:
        from_attributes = True
