from fastapi import (
    FastAPI,
    Depends,
    HTTPException,
    status,
    WebSocket,
    WebSocketDisconnect,
    Request,
)
from fastapi.responses import JSONResponse, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from datetime import timedelta, datetime, timezone
from typing import List, Optional
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import uuid
import logging

import models
from models import UserRole
import schemas
import auth
from database import get_db
from dependencies import (
    ACCESS_TOKEN_NAME,
    REFRESH_TOKEN_NAME,
    CSRF_TOKEN_NAME,
    get_current_user,
    get_auth_cookie_settings,
    get_token_from_cookie,
    get_token_from_header,
    require_permissions,
    create_auth_cookies,
    clear_auth_cookies,
    require_csrf,
)
from config import settings
from redis_mgr import redis_mgr
from security import generate_csrf_token

limiter = Limiter(key_func=get_remote_address)
logger = logging.getLogger("sky_exam.security")
app = FastAPI(
    title="SKY-EXAM API",
    description="Hệ thống quản lý thi trực tuyến thế hệ mới - SKY-EXAM",
    version="1.0.0",
)
app.state.limiter = limiter


async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={
            "detail": f"Too many requests. Rate limit exceeded. Please wait before trying again.",
            "retry_after": getattr(exc, "retry_after", None),
        },
    )


app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)

CORS_ALLOWED_ORIGINS = settings.allowed_origins

CORS_ALLOWED_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]

CORS_ALLOWED_HEADERS = [
    "Accept",
    "Authorization",
    "Content-Type",
    "X-CSRF-Token",
    "ngrok-skip-browser-warning",
]

CORS_EXPOSE_HEADERS = [
    "Content-Length",
    "X-Request-ID",
    "X-CSRF-Token",
]

CORS_MAX_AGE = 600

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=CORS_ALLOWED_METHODS,
    allow_headers=CORS_ALLOWED_HEADERS,
    expose_headers=CORS_EXPOSE_HEADERS,
    max_age=CORS_MAX_AGE,
)

from routers import websockets

app.include_router(websockets.router)


@app.get("/")
def read_root():
    return {"status": "success", "message": "Welcome to the SKY-EXAM API"}


@app.post(
    "/register",
    response_model=schemas.UserResponse,
    status_code=status.HTTP_201_CREATED,
)
@limiter.limit("3/minute")
def register(request: Request, user: schemas.UserCreate, db: Session = Depends(get_db)):

    db_user = (
        db.query(models.User).filter(models.User.username == user.username).first()
    )
    if db_user:
        raise HTTPException(
            status_code=400, detail="Username đã tồn tại, không cho tạo!"
        )

    # Create user
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(
        username=user.username,
        hashed_password=hashed_password,
        full_name=user.full_name,
        role=user.role,
        permissions=auth.ROLE_PERMISSIONS.get(user.role, []),
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@app.post("/login", response_model=schemas.TokenResponse)
@limiter.limit("5/minute")
def login(
    request: Request,
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    user = (
        db.query(models.User).filter(models.User.username == form_data.username).first()
    )
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = user.id

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.username, "role": user.role, "user_id": user_id},
        expires_delta=access_token_expires,
    )

    refresh_token_data, expires_at = auth.create_refresh_token_data(user_id)  # type: ignore[arg-type]
    db_refresh_token = models.RefreshToken(
        user_id=user_id,  # type: ignore[arg-type]
        token=refresh_token_data["token"],
        expires_at=expires_at,
    )
    db.add(db_refresh_token)
    db.commit()

    csrf_token = generate_csrf_token()
    cookies = create_auth_cookies(
        access_token=access_token,
        refresh_token=refresh_token_data["token"],
        csrf_token=csrf_token,
        access_expires=settings.ACCESS_TOKEN_EXPIRE_MINUTES,
        refresh_expires=settings.REFRESH_TOKEN_EXPIRE_DAYS,
    )

    for cookie_name, cookie_params in cookies.items():
        response.set_cookie(key=cookie_name, **cookie_params)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token_data["token"],
        "token_type": "bearer",
        "user": user,
    }


@app.post("/refresh", response_model=schemas.TokenResponse)
@limiter.limit("10/minute")
def refresh_token(
    request: Request,
    response: Response,
    token_data: schemas.TokenRefreshRequest,
    db: Session = Depends(get_db),
):
    if redis_mgr.is_refresh_token_blacklisted(token_data.refresh_token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has been revoked",
        )

    db_token = (
        db.query(models.RefreshToken)
        .filter(
            models.RefreshToken.token == token_data.refresh_token,
            models.RefreshToken.revoked == False,
        )
        .first()
    )

    if not db_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    if db_token.expires_at < datetime.now(timezone.utc):
        db_token.revoked = True  # type: ignore[assignment]
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has expired",
        )

    user_id = db_token.user_id
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    redis_mgr.blacklist_refresh_token(
        token_data.refresh_token, timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    )

    new_access_token = auth.create_access_token(
        data={"sub": user.username, "role": user.role, "user_id": user.id},
    )

    new_refresh_token_data, new_expires_at = auth.create_refresh_token_data(user_id)  # type: ignore[arg-type]

    db_token.revoked = True  # type: ignore[assignment]
    db_token.replaced_by_token = new_refresh_token_data["token"]

    db_new_refresh_token = models.RefreshToken(
        user_id=user_id,  # type: ignore[arg-type]
        token=new_refresh_token_data["token"],
        expires_at=new_expires_at,
    )
    db.add(db_new_refresh_token)
    db.commit()

    csrf_token = generate_csrf_token()
    cookies = create_auth_cookies(
        access_token=new_access_token,
        refresh_token=new_refresh_token_data["token"],
        csrf_token=csrf_token,
        access_expires=settings.ACCESS_TOKEN_EXPIRE_MINUTES,
        refresh_expires=settings.REFRESH_TOKEN_EXPIRE_DAYS,
    )

    for cookie_name, cookie_params in cookies.items():
        response.set_cookie(key=cookie_name, **cookie_params)

    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token_data["token"],
        "token_type": "bearer",
        "user": user,
    }


@app.post("/logout")
@limiter.limit("10/minute")
def logout(
    request: Request,
    response: Response,
):
    access_token = get_token_from_header(request) or get_token_from_cookie(request)
    if access_token:
        try:
            payload = jwt.decode(
                access_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
            )
            token_jti = payload.get("jti")
            if token_jti:
                expires_delta = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
                redis_mgr.blacklist_access_token(str(token_jti), expires_delta)
        except JWTError:
            pass

    refresh_token = request.cookies.get(REFRESH_TOKEN_NAME)

    if refresh_token:
        redis_mgr.blacklist_refresh_token(
            refresh_token, timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        )
    cookie_settings = get_auth_cookie_settings()
    response.delete_cookie(key=ACCESS_TOKEN_NAME, httponly=True, **cookie_settings)
    response.delete_cookie(key=REFRESH_TOKEN_NAME, httponly=True, **cookie_settings)
    response.delete_cookie(key=CSRF_TOKEN_NAME, httponly=False, **cookie_settings)

    return {"message": "Successfully logged out"}


@app.post("/logout-all")
@limiter.limit("10/minute")
def logout_all_devices(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
    _csrf: None = Depends(require_csrf),
):
    if hasattr(request.state, "token_jti") and request.state.token_jti:
        expires_delta = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        redis_mgr.blacklist_access_token(request.state.token_jti, expires_delta)

    db.query(models.RefreshToken).filter(
        models.RefreshToken.user_id == current_user.id,
        models.RefreshToken.revoked == False,
    ).update({"revoked": True})  # type: ignore[arg-type]
    db.commit()

    cookies = clear_auth_cookies()
    for cookie_name, cookie_params in cookies.items():
        response.delete_cookie(**cookie_params)

    return {"message": "Successfully logged out from all devices"}


@app.post(
    "/security/devtools-violation",
    response_model=schemas.SecurityViolationResponse,
)
@limiter.limit("20/minute")
def log_security_violation(
    request: Request,
    payload: schemas.SecurityViolationCreate,
    current_user: models.User = Depends(get_current_user),
):
    detected_at = payload.detected_at or datetime.now(timezone.utc)
    logger.warning(
        "Security violation detected | user_id=%s username=%s role=%s exam_id=%s type=%s detected_at=%s metadata=%s ip=%s",
        current_user.id,
        current_user.username,
        current_user.role,
        payload.exam_id,
        payload.violation_type,
        detected_at.isoformat(),
        payload.metadata,
        get_remote_address(request),
    )
    return {"message": "Security violation logged"}


# -----------------
# Protected Endpoints Examples
# -----------------
@app.get("/users", response_model=List[schemas.UserResponse])
def get_all_users(
    db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
):
    """
    ADMIN ONLY: Lấy danh sách toàn bộ người dùng trong hệ thống.
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bạn không có quyền truy cập dữ liệu tối mật này!",
        )
    return db.query(models.User).all()


@app.get("/users/me", response_model=schemas.UserResponse)
def read_users_me(current_user: models.User = Depends(get_current_user)):
    """
    Returns information about the currently logged-in user.
    """
    return current_user


# -----------------
# Exam (Quiz) Endpoints
# -----------------


@app.post(
    "/exams", response_model=schemas.QuizResponse, status_code=status.HTTP_201_CREATED
)
def create_exam(
    exam: schemas.QuizCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permissions(["exam:create"])),
):
    """
    Chỉ ADMIN hoặc TEACHER được tạo đề thi. teacher_id lấy từ current_user.
    """
    db_quiz = models.Quiz(
        title=exam.title,
        time_limit=exam.time_limit,
        password=exam.password,
        class_id=exam.class_id,
        teacher_id=current_user.id,
    )
    db.add(db_quiz)
    db.commit()
    db.refresh(db_quiz)
    return db_quiz


@app.get("/exams", response_model=list[schemas.QuizResponse])
def get_exams(
    db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
):
    """
    Lấy danh sách đề thi theo phân quyền:
    - ADMIN: Thấy toàn bộ đề thi trong hệ thống.
    - TEACHER: Chỉ thấy đề thi do mình tạo.
    - STUDENT: Chỉ thấy đề thi thuộc các lớp mình đã tham gia (qua bảng enrollments).
    """
    if current_user.role == "admin":
        return db.query(models.Quiz).all()
    elif current_user.role == "teacher":
        return (
            db.query(models.Quiz)
            .filter(models.Quiz.teacher_id == current_user.id)
            .all()
        )
    else:
        # STUDENT: Chỉ lấy đề thi PUBLIC (class_id == None)
        return db.query(models.Quiz).filter(models.Quiz.class_id == None).all()


@app.get("/exams/{exam_id}", response_model=schemas.QuizResponse)
def get_exam(
    exam_id: int,
    password: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Lấy chi tiết đề thi kèm danh sách câu hỏi.
    Nếu đề có password, Lão đại quy định phải check mới cho xem (ngay cả Teacher/Admin cũng vậy, hoặc có thể bypass nếu là tác giả).
    """
    exam = db.query(models.Quiz).filter(models.Quiz.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    if exam.password:
        # Nếu là ADMIN hoặc chủ đề thi thì có thể bypass password (tùy Lão đại, nhưng e viết chặt tròng luôn)
        # Nếu muốn chặt chẽ: password check bắt buộc
        if current_user.role == "student" and password != exam.password:
            raise HTTPException(status_code=403, detail="Mật khẩu đề thi không đúng")

    return exam


@app.put("/exams/{exam_id}", response_model=schemas.QuizResponse)
def update_exam(
    exam_id: int,
    exam_update: schemas.QuizUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permissions(["exam:update"])),
):
    """
    Sửa đề thi. Yêu cầu quyền sở hữu hoặc ADMIN.
    """
    exam = db.query(models.Quiz).filter(models.Quiz.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    if current_user.role != "admin" and exam.teacher_id != current_user.id:
        raise HTTPException(
            status_code=403, detail="Không có quyền sửa đề thi của người khác"
        )

    update_data = exam_update.model_dump(
        exclude_unset=True
    )  # Dùng dictionary cho Pydantic v2
    for key, value in update_data.items():
        setattr(exam, key, value)

    db.commit()
    db.refresh(exam)
    return exam


@app.delete("/exams/{exam_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_exam(
    exam_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permissions(["exam:delete"])),
):
    """
    Xóa đề thi. Yêu cầu quyền sở hữu hoặc ADMIN.
    """
    exam = db.query(models.Quiz).filter(models.Quiz.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    if current_user.role != "admin" and exam.teacher_id != current_user.id:
        raise HTTPException(
            status_code=403, detail="Không có quyền xóa đề thi của người khác"
        )

    db.delete(exam)
    db.commit()
    return None


# -----------------
# Class Enrollment Endpoints
# -----------------


@app.post("/classes/join", status_code=status.HTTP_200_OK)
def join_class(
    invite_code: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permissions(["class:join"])),
):
    """
    Sinh viên dùng invite_code để tham gia lớp học.
    - Chỉ STUDENT mới được gọi endpoint này (đã dùng Depends(require_permissions)).

    - Check trùng lặp: nếu đã join rồi thì báo lỗi.
    """
    # Tìm lớp theo invite_code
    class_obj = (
        db.query(models.Class).filter(models.Class.invite_code == invite_code).first()
    )
    if not class_obj:
        raise HTTPException(status_code=404, detail="Không tìm thấy lớp với mã mời này")

    # Check trùng lặp: sinh viên đã ở trong lớp chưa
    if current_user in class_obj.students:
        raise HTTPException(status_code=400, detail="Bạn đã tham gia lớp này rồi")

    # Thêm sinh viên vào lớp
    class_obj.students.append(current_user)
    db.commit()

    return {
        "message": f"Tham gia lớp '{class_obj.name}' thành công!",
        "class_id": class_obj.id,
        "class_name": class_obj.name,
    }


# -----------------
# Exam Submission & Grading Endpoints
# -----------------


@app.post("/exams/{exam_id}/submit", response_model=schemas.SubmitResponse)
@limiter.limit("2/10minutes")
def submit_exam(
    request: Request,
    exam_id: int,
    payload: schemas.SubmitExamRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permissions(["submission:create"])),
):
    """
    Sinh viên nộp bài và nhận điểm ngay lập tức.
    Security:
    - Chỉ STUDENT mới được nộp.
    - Check đề thi tồn tại.
    - Check sinh viên có thuộc lớp được giao đề thi không.
    - Check nộp trùng lặp (đã SUBMITTED thì cấm nộp lại).
    """
    # 1. Check đề thi tồn tại
    quiz = db.query(models.Quiz).filter(models.Quiz.id == exam_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Đề thi không tồn tại")

    # 2. Check sinh viên có thuộc lớp được giao đề thi này không
    if quiz.class_id:
        enrolled_class_ids = [c.id for c in current_user.enrolled_classes]
        if quiz.class_id not in enrolled_class_ids:
            raise HTTPException(
                status_code=403,
                detail="Bạn không thuộc lớp được giao đề thi này. Hãy tham gia lớp trước!",
            )

    # 3. Check nộp trùng lặp
    existing_submission = (
        db.query(models.Submission)
        .filter(
            models.Submission.student_id == current_user.id,
            models.Submission.quiz_id == exam_id,
            models.Submission.status == models.SubmissionStatus.SUBMITTED,
        )
        .first()
    )
    if existing_submission:
        raise HTTPException(
            status_code=400, detail="Bạn đã nộp bài này rồi. Không được nộp lại!"
        )

    # 4. Chấm điểm - Batch Query tối ưu
    # Lấy tất cả choice_id mà sinh viên đã chọn
    submitted_choice_ids = [a.choice_id for a in payload.answers]
    submitted_question_ids = [a.question_id for a in payload.answers]

    # Query 1 phát lấy hết các Choice đúng mà sinh viên đã chọn
    correct_choices = (
        db.query(models.Choice)
        .filter(
            models.Choice.id.in_(submitted_choice_ids), models.Choice.is_correct == True
        )
        .all()
    )

    # Tạo set question_id của những câu trả lời đúng
    correct_question_ids = {c.question_id for c in correct_choices}

    # Query lấy points của các câu hỏi trả lời đúng
    correct_questions = (
        db.query(models.Question)
        .filter(models.Question.id.in_(list(correct_question_ids)))
        .all()
    )
    score = sum(q.points for q in correct_questions)

    # Tính tổng điểm tối đa của đề thi
    all_questions = (
        db.query(models.Question).filter(models.Question.quiz_id == exam_id).all()
    )
    total_points = sum(q.points for q in all_questions)

    # 5. Lưu vào bảng Submission
    # Tìm submission IN_PROGRESS (nếu có) hoặc tạo mới
    submission = (
        db.query(models.Submission)
        .filter(
            models.Submission.student_id == current_user.id,
            models.Submission.quiz_id == exam_id,
            models.Submission.status == models.SubmissionStatus.IN_PROGRESS,
        )
        .first()
    )

    if submission:
        submission.score = score
        submission.status = models.SubmissionStatus.SUBMITTED
        submission.finished_at = func.now()
        # Nếu FE gửi cheat_count lên thì cập nhật, nếu không thì giữ nguyên (hoặc cộng thêm)
        if payload.cheat_count > 0:
            submission.cheat_count = payload.cheat_count
    else:
        submission = models.Submission(
            student_id=current_user.id,
            quiz_id=exam_id,
            score=score,
            status=models.SubmissionStatus.SUBMITTED,
            finished_at=func.now(),
            cheat_count=payload.cheat_count,
        )
        db.add(submission)

    db.commit()

    return {
        "score": score,
        "total_points": total_points,
        "status": "SUBMITTED",
        "message": f"Nộp bài thành công! Điểm: {score}/{total_points}",
        "cheat_count": submission.cheat_count,
    }


# -----------------
# Class CRUD Endpoints
# -----------------


@app.post(
    "/classes",
    response_model=schemas.ClassResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_class(
    class_data: schemas.ClassCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permissions(["class:create"])),
):
    """
    Tạo lớp học mới. Chỉ TEACHER/ADMIN được tạo.
    Nếu không truyền invite_code, hệ thống tự sinh mã ngẫu nhiên 8 ký tự.
    """
    invite_code = class_data.invite_code or uuid.uuid4().hex[:8].upper()

    # Check trùng invite_code
    existing = (
        db.query(models.Class).filter(models.Class.invite_code == invite_code).first()
    )
    if existing:
        raise HTTPException(
            status_code=400, detail="Mã mời này đã tồn tại, hãy chọn mã khác"
        )

    db_class = models.Class(
        name=class_data.name, invite_code=invite_code, teacher_id=current_user.id
    )
    db.add(db_class)
    db.commit()
    db.refresh(db_class)
    return db_class


@app.get("/classes", response_model=List[schemas.ClassResponse])
def get_classes(
    db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
):
    """
    Lấy danh sách lớp học theo phân quyền:
    - ADMIN: Thấy toàn bộ lớp trong hệ thống.
    - TEACHER: Chỉ thấy lớp do mình tạo.
    - STUDENT: Chỉ thấy các lớp mình đã tham gia (qua bảng enrollments).
    """
    if current_user.role == "admin":
        return db.query(models.Class).all()
    elif current_user.role == "teacher":
        return (
            db.query(models.Class)
            .filter(models.Class.teacher_id == current_user.id)
            .all()
        )
    else:
        return current_user.enrolled_classes


@app.get("/classes/{class_id}/exams", response_model=List[schemas.QuizResponse])
def get_class_exams(
    class_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Lấy danh sách đề thi của một lớp học cụ thể.
    - STUDENT: Phải tham gia lớp mới được lấy.
    - TEACHER: Phải là giáo viên tạo lớp này.
    """
    class_obj = db.query(models.Class).filter(models.Class.id == class_id).first()
    if not class_obj:
        raise HTTPException(status_code=404, detail="Không tìm thấy lớp học")

    if current_user.role == UserRole.STUDENT:
        if current_user not in class_obj.students:
            raise HTTPException(status_code=403, detail="Bạn chưa tham gia lớp học này")
    elif current_user.role == UserRole.TEACHER:
        if class_obj.teacher_id != current_user.id:
            raise HTTPException(
                status_code=403, detail="Không có quyền xem lớp của người khác"
            )

    exams = db.query(models.Quiz).filter(models.Quiz.class_id == class_id).all()
    return exams


# -----------------
# Question Management Endpoints
# -----------------


@app.post(
    "/exams/{exam_id}/questions",
    response_model=List[schemas.QuestionResponse],
    status_code=status.HTTP_201_CREATED,
)
def add_questions(
    exam_id: int,
    questions: List[schemas.QuestionCreate],
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permissions(["question:manage"])),
):
    """
    Thêm batch câu hỏi kèm đáp án vào đề thi.
    - Chỉ Teacher/Admin sở hữu đề thi mới được thêm.
    - Mỗi câu hỏi đi kèm mảng choices.
    """
    # Check đề thi tồn tại
    quiz = db.query(models.Quiz).filter(models.Quiz.id == exam_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Đề thi không tồn tại")

    # Check quyền sở hữu (trừ ADMIN thì bypass)
    if current_user.role != "admin" and quiz.teacher_id != current_user.id:
        raise HTTPException(
            status_code=403, detail="Bạn không có quyền thêm câu hỏi vào đề thi này"
        )

    created_questions = []
    for q_data in questions:
        # Tạo Question
        db_question = models.Question(
            quiz_id=exam_id, content=q_data.content, points=q_data.points
        )
        db.add(db_question)
        db.flush()  # Flush để lấy id của question trước khi tạo choices

        # Tạo Choices cho question này
        for c_data in q_data.choices:
            db_choice = models.Choice(
                question_id=db_question.id,
                content=c_data.content,
                is_correct=c_data.is_correct,
            )
            db.add(db_choice)

        created_questions.append(db_question)

    db.commit()
    # Refresh tất cả để load relationships (choices)
    for q in created_questions:
        db.refresh(q)

    return created_questions


@app.get(
    "/exams/{exam_id}/questions_for_teacher",
    response_model=List[schemas.QuestionResponse],
)
def get_questions_for_teacher(
    exam_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permissions(["question:manage"])),
):
    """
    Giáo viên lấy danh sách câu hỏi CÓ KÈM ĐÁP ÁN ĐÚNG.
    """
    quiz = db.query(models.Quiz).filter(models.Quiz.id == exam_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Đề thi không tồn tại")

    if current_user.role != "admin" and quiz.teacher_id != current_user.id:
        raise HTTPException(
            status_code=403, detail="Không có quyền xem đáp án đề thi này"
        )

    questions = (
        db.query(models.Question).filter(models.Question.quiz_id == exam_id).all()
    )
    return questions


@app.put("/questions/{question_id}", response_model=schemas.QuestionResponse)
def update_question(
    question_id: int,
    question_update: schemas.QuestionUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permissions(["question:manage"])),
):
    """
    Giáo viên sửa câu hỏi và đáp án.
    """
    question = (
        db.query(models.Question).filter(models.Question.id == question_id).first()
    )
    if not question:
        raise HTTPException(status_code=404, detail="Câu hỏi không tồn tại")

    quiz = db.query(models.Quiz).filter(models.Quiz.id == question.quiz_id).first()
    if current_user.role != "admin" and quiz.teacher_id != current_user.id:
        raise HTTPException(
            status_code=403, detail="Không có quyền sửa câu hỏi của đề thi khác"
        )

    # Cập nhật nội dung câu hỏi
    if question_update.content is not None:
        question.content = question_update.content
    if question_update.points is not None:
        question.points = question_update.points

    # Cập nhật Choices
    if question_update.choices is not None:
        # Xóa các choice cũ và thêm choice mới (Cách đơn giản nhất)
        # Hoặc update thông minh dựa vào ID
        existing_choices = {c.id: c for c in question.choices}

        # Để đơn giản và an toàn, ta xóa hết các choice của question này rồi tạo lại, hoặc update mapping
        db.query(models.Choice).filter(
            models.Choice.question_id == question_id
        ).delete()

        for c_data in question_update.choices:
            new_choice = models.Choice(
                question_id=question.id,
                content=c_data.content,
                is_correct=c_data.is_correct,
            )
            db.add(new_choice)

    db.commit()
    db.refresh(question)
    return question


@app.delete("/questions/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_question(
    question_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permissions(["question:manage"])),
):
    """
    Giáo viên xóa câu hỏi khỏi đề thi.
    """
    question = (
        db.query(models.Question).filter(models.Question.id == question_id).first()
    )
    if not question:
        raise HTTPException(status_code=404, detail="Câu hỏi không tồn tại")

    quiz = db.query(models.Quiz).filter(models.Quiz.id == question.quiz_id).first()
    if current_user.role != "admin" and quiz.teacher_id != current_user.id:
        raise HTTPException(
            status_code=403, detail="Không có quyền xóa câu hỏi của người khác"
        )

    db.delete(question)
    db.commit()
    return None


# -----------------
# Submission History & Stats Endpoints
# -----------------


@app.get("/submissions/me", response_model=List[schemas.SubmissionResponse])
def get_my_submissions(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permissions(["submission:read_own"])),
):
    """
    Student xem lịch sử các bài đã nộp và điểm số của mình.
    """
    submissions = (
        db.query(models.Submission)
        .filter(models.Submission.student_id == current_user.id)
        .order_by(models.Submission.started_at.desc())
        .all()
    )
    return submissions


@app.get(
    "/exams/{exam_id}/submissions", response_model=List[schemas.SubmissionResponse]
)
def get_exam_submissions(
    exam_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permissions(["submission:read"])),
):
    """
    Teacher/Admin xem danh sách điểm của tất cả học sinh đã nộp bài cho đề thi này.
    - Check đề thi tồn tại.
    - Check quyền sở hữu (trừ ADMIN).
    """
    quiz = db.query(models.Quiz).filter(models.Quiz.id == exam_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Đề thi không tồn tại")

    if current_user.role != "admin" and quiz.teacher_id != current_user.id:
        raise HTTPException(
            status_code=403, detail="Bạn không có quyền xem kết quả đề thi này"
        )

    submissions = (
        db.query(models.Submission)
        .filter(models.Submission.quiz_id == exam_id)
        .order_by(models.Submission.finished_at.desc())
        .all()
    )
    return submissions


# -----------------
# WebSocket Anti-Cheat
# -----------------
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)


manager = ConnectionManager()


@app.websocket("/ws/anti-cheat/{exam_id}/{user_id}")
async def websocket_endpoint(websocket: WebSocket, exam_id: int, user_id: int):
    db: Session = next(get_db())
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "cheat_detected":
                # Tìm hoặc tạo submission IN_PROGRESS để tăng cheat_count
                submission = (
                    db.query(models.Submission)
                    .filter(
                        models.Submission.student_id == user_id,
                        models.Submission.quiz_id == exam_id,
                        models.Submission.status == models.SubmissionStatus.IN_PROGRESS,
                    )
                    .first()
                )

                if not submission:
                    submission = models.Submission(
                        student_id=user_id,
                        quiz_id=exam_id,
                        status=models.SubmissionStatus.IN_PROGRESS,
                    )
                    db.add(submission)

                submission.cheat_count = (submission.cheat_count or 0) + 1
                db.commit()
                await websocket.send_text(
                    f"Warning: Cheat detected! Total: {submission.cheat_count}"
                )
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    finally:
        db.close()
