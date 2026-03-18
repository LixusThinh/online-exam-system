from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta

# Import mấy cái "hàng nhà làm" của mày vào đây
import models.user
import models.quiz
import schemas
import auth
from database import get_db, init_db
from dependencies import get_current_user, require_role
from models.user import UserRole

# 1. Khởi tạo DB trước khi App chạy
init_db()

# 2. Khai báo App
app = FastAPI(
    title="Online Exam System API",
    description="Backend API cho con Azota Clone",
    version="1.0.0"
)

# 3. Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "success", "message": "Backend da thong nong!"}

# ... Các route khác (register, login) giữ nguyên bên dưới ...

@app.get("/")
def read_root():
    return {"status": "success", "message": "Welcome to the Online Exam System API"}

@app.post("/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # Check if username exists
    db_user = db.query(models.user.User).filter(models.user.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
        
    # Check if email exists
    db_email = db.query(models.user.User).filter(models.user.User.email == user.email).first()
    if db_email:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.user.User(
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        hashed_password=hashed_password,
        role=user.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # Verify user
    user = db.query(models.user.User).filter(models.user.User.username == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Generate token
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.username, "role": user.role}, expires_delta=access_token_expires
    )
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": user
    }

# -----------------
# Protected Endpoints Examples
# -----------------
@app.get("/users/me", response_model=schemas.UserResponse)
def read_users_me(current_user: models.user.User = Depends(get_current_user)):
    """
    Returns information about the currently logged-in user.
    """
    return current_user

@app.post("/exams/draft")
def draft_exam(current_user: models.user.User = Depends(require_role([UserRole.TEACHER, UserRole.ADMIN]))):
    """
    Only Teachers and Admins can create exams.
    """
    return {
        "message": "Exam drafted successfully. Role verified.", 
        "user": current_user.username,
        "role": current_user.role
    }

from typing import List
import models.exam
from database import SessionLocal

@app.on_event("startup")
def init_exam_data():
    db = SessionLocal()
    try:
        exam = db.query(models.exam.Exam).first()
        if not exam:
            exam = models.exam.Exam(title="Đề thi mẫu Lập trình Web Frontend")
            db.add(exam)
            db.commit()
            db.refresh(exam)
            
            q1 = models.exam.Question(exam_id=exam.id, content="Trong Bootstrap 5, class nào được sử dụng để biến một nhóm radio buttons thành dạng nút bấm (button-like)?", options={"A": ".btn-radio", "B": ".btn-check", "C": ".radio-btn", "D": ".form-check-button"}, correct_option="B")
            q2 = models.exam.Question(exam_id=exam.id, content="Đâu là thẻ HTML5 đúng để chứa các liên kết điều hướng (navigation links)?", options={"A": "<nav>", "B": "<navigate>", "C": "<menu>", "D": "<header>"}, correct_option="A")
            q3 = models.exam.Question(exam_id=exam.id, content="Thay đổi quan trọng nào sau đây có trong Bootstrap 5 so với Bootstrap 4?", options={"A": "Yêu cầu tải kèm theo ReactJS", "B": "Chuyển từ Flexbox sang CSS Grid làm mặc định", "C": "Loại bỏ JQuery, thay bằng Vanilla JS", "D": "Không hỗ trợ giao diện Mobile-first nữa"}, correct_option="C")
            q4 = models.exam.Question(exam_id=exam.id, content="Để trích xuất query parameters chuẩn REST trong FastAPI, ta sử dụng Class nào?", options={"A": "Path", "B": "Body", "C": "Query", "D": "Form"}, correct_option="C")
            q5 = models.exam.Question(exam_id=exam.id, content="Thẻ nào dùng để tạo danh sách không có thứ tự trong HTML?", options={"A": "<ol>", "B": "<li>", "C": "<ul>", "D": "<dl>"}, correct_option="C")
            
            db.add_all([q1, q2, q3, q4, q5])
            db.commit()
    finally:
        db.close()

@app.get("/exams/{exam_id}", response_model=schemas.ExamResponse)
def get_exam(exam_id: int, db: Session = Depends(get_db)):
    # Đọc đề thi từ DB. Pydantic schema QuestionResponse sẽ tự lọc bỏ correct_option nên ko lo lộ
    exam = db.query(models.exam.Exam).filter(models.exam.Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    return exam

@app.post("/exams/{exam_id}/submit", response_model=schemas.SubmitResponse)
def submit_exam(
    exam_id: int,
    payload: List[schemas.AnswerItem],
    db: Session = Depends(get_db),
    current_user: models.user.User = Depends(get_current_user)
):
    # Lấy bài thi và hệ thống đúng/sai
    exam = db.query(models.exam.Exam).filter(models.exam.Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
        
    questions_dict = {q.id: q.correct_option for q in exam.questions}
    total = len(questions_dict)
    if total == 0:
        raise HTTPException(status_code=400, detail="Exam has no questions")

    # So sánh các câu trả lời của user gửi lên
    correct = 0
    for item in payload:
        if item.question_id in questions_dict and questions_dict[item.question_id] == item.answer:
            correct += 1

    # Tính điểm hệ 10
    score = (correct / total) * 10.0
    
    # Lưu kết quả
    result = models.exam.Result(user_id=current_user.id, exam_id=exam_id, score=score)
    db.add(result)
    db.commit()
    
    # Trả về thống kê con cho frontend
    return {"score": score, "correct": correct, "total": total}
