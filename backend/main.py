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
import routers.auth
import routers.profiles

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

# Register the new routers here
app.include_router(routers.auth.router)
app.include_router(routers.profiles.router)

# ... Các route khác (register, login) giữ nguyên bên dưới ...

@app.post("/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # Check if username exists
    db_user = db.query(models.user.User).filter(models.user.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    # Create user
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.user.User(
        username=user.username,
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
