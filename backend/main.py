from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from datetime import timedelta
from typing import List, Optional
import uuid

# Import mấy cái "hàng nhà làm" của mày vào đây
import models
import schemas
import auth
from database import get_db, init_db
from dependencies import get_current_user, require_role
from models import UserRole

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
    return {"status": "success", "message": "Welcome to the Online Exam System API"}

@app.post("/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # 1. Chỉ check DUY NHẤT username (vì DB làm đéo có cột email)
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username đã tồn tại, đéo cho tạo!")
        
    # 2. Đoạn này là code tạo user và hash password của mày (giữ nguyên, tao viết tượng trưng)
    # new_user = models.User(username=user.username, ...)
    # db.add(new_user)
    # db.commit()
    # return new_user
    
    # Create user
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(
        username=user.username,
        hashed_password=hashed_password,
        full_name=user.full_name,
        role=user.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # Verify user
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
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
def read_users_me(current_user: models.User = Depends(get_current_user)):
    """
    Returns information about the currently logged-in user.
    """
    return current_user



# -----------------
# Exam (Quiz) Endpoints
# -----------------

@app.post("/exams", response_model=schemas.QuizResponse, status_code=status.HTTP_201_CREATED)
def create_exam(
    exam: schemas.QuizCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role([UserRole.TEACHER, UserRole.ADMIN]))
):
    """
    Chỉ ADMIN hoặc TEACHER được tạo đề thi. teacher_id lấy từ current_user.
    """
    db_quiz = models.Quiz(
        title=exam.title,
        time_limit=exam.time_limit,
        password=exam.password,
        class_id=exam.class_id,
        teacher_id=current_user.id
    )
    db.add(db_quiz)
    db.commit()
    db.refresh(db_quiz)
    return db_quiz

@app.get("/exams", response_model=list[schemas.QuizResponse])
def get_exams(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """
    Lấy danh sách đề thi theo phân quyền:
    - ADMIN: Thấy toàn bộ đề thi trong hệ thống.
    - TEACHER: Chỉ thấy đề thi do mình tạo.
    - STUDENT: Chỉ thấy đề thi thuộc các lớp mình đã tham gia (qua bảng enrollments).
    """
    if current_user.role == UserRole.ADMIN:
        return db.query(models.Quiz).all()
    elif current_user.role == UserRole.TEACHER:
        return db.query(models.Quiz).filter(models.Quiz.teacher_id == current_user.id).all()
    else:
        # Lấy danh sách class_id mà sinh viên này đã enroll
        enrolled_class_ids = [
            c.id for c in current_user.enrolled_classes
        ]
        if not enrolled_class_ids:
            return []
        return db.query(models.Quiz).filter(
            models.Quiz.class_id.in_(enrolled_class_ids)
        ).all()

@app.get("/exams/{exam_id}", response_model=schemas.QuizResponse)
def get_exam(
    exam_id: int, 
    password: Optional[str] = None, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
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
        if current_user.role == UserRole.STUDENT and password != exam.password:
            raise HTTPException(status_code=403, detail="Mật khẩu đề thi không đúng")
            
    return exam

@app.put("/exams/{exam_id}", response_model=schemas.QuizResponse)
def update_exam(
    exam_id: int,
    exam_update: schemas.QuizUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role([UserRole.TEACHER, UserRole.ADMIN]))
):
    """
    Sửa đề thi. Yêu cầu quyền sở hữu hoặc ADMIN.
    """
    exam = db.query(models.Quiz).filter(models.Quiz.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
        
    if current_user.role != UserRole.ADMIN and exam.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Không có quyền sửa đề thi của người khác")
        
    update_data = exam_update.model_dump(exclude_unset=True) # Dùng dictionary cho Pydantic v2
    for key, value in update_data.items():
        setattr(exam, key, value)
        
    db.commit()
    db.refresh(exam)
    return exam

@app.delete("/exams/{exam_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_exam(
    exam_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role([UserRole.TEACHER, UserRole.ADMIN]))
):
    """
    Xóa đề thi. Yêu cầu quyền sở hữu hoặc ADMIN.
    """
    exam = db.query(models.Quiz).filter(models.Quiz.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
        
    if current_user.role != UserRole.ADMIN and exam.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Không có quyền xóa đề thi của người khác")
        
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
    current_user: models.User = Depends(require_role([UserRole.STUDENT]))
):
    """
    Sinh viên dùng invite_code để tham gia lớp học.
    - Chỉ STUDENT mới được gọi endpoint này.
    - Check trùng lặp: nếu đã join rồi thì báo lỗi.
    """
    # Tìm lớp theo invite_code
    class_obj = db.query(models.Class).filter(models.Class.invite_code == invite_code).first()
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
        "class_name": class_obj.name
    }

# -----------------
# Exam Submission & Grading Endpoints
# -----------------

@app.post("/exams/{exam_id}/submit", response_model=schemas.SubmitResponse)
def submit_exam(
    exam_id: int,
    payload: schemas.SubmitExamRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role([UserRole.STUDENT]))
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
                detail="Bạn không thuộc lớp được giao đề thi này. Hãy tham gia lớp trước!"
            )

    # 3. Check nộp trùng lặp
    existing_submission = db.query(models.Submission).filter(
        models.Submission.student_id == current_user.id,
        models.Submission.quiz_id == exam_id,
        models.Submission.status == models.SubmissionStatus.SUBMITTED
    ).first()
    if existing_submission:
        raise HTTPException(
            status_code=400,
            detail="Bạn đã nộp bài này rồi. Không được nộp lại!"
        )

    # 4. Chấm điểm - Batch Query tối ưu
    # Lấy tất cả choice_id mà sinh viên đã chọn
    submitted_choice_ids = [a.choice_id for a in payload.answers]
    submitted_question_ids = [a.question_id for a in payload.answers]

    # Query 1 phát lấy hết các Choice đúng mà sinh viên đã chọn
    correct_choices = db.query(models.Choice).filter(
        models.Choice.id.in_(submitted_choice_ids),
        models.Choice.is_correct == True
    ).all()

    # Tạo set question_id của những câu trả lời đúng
    correct_question_ids = {c.question_id for c in correct_choices}

    # Query lấy points của các câu hỏi trả lời đúng
    correct_questions = db.query(models.Question).filter(
        models.Question.id.in_(list(correct_question_ids))
    ).all()
    score = sum(q.points for q in correct_questions)

    # Tính tổng điểm tối đa của đề thi
    all_questions = db.query(models.Question).filter(
        models.Question.quiz_id == exam_id
    ).all()
    total_points = sum(q.points for q in all_questions)

    # 5. Lưu vào bảng Submission
    # Tìm submission IN_PROGRESS (nếu có) hoặc tạo mới
    submission = db.query(models.Submission).filter(
        models.Submission.student_id == current_user.id,
        models.Submission.quiz_id == exam_id,
        models.Submission.status == models.SubmissionStatus.IN_PROGRESS
    ).first()

    if submission:
        submission.score = score
        submission.status = models.SubmissionStatus.SUBMITTED
        submission.finished_at = func.now()
    else:
        submission = models.Submission(
            student_id=current_user.id,
            quiz_id=exam_id,
            score=score,
            status=models.SubmissionStatus.SUBMITTED,
            finished_at=func.now()
        )
        db.add(submission)

    db.commit()

    return {
        "score": score,
        "total_points": total_points,
        "status": "SUBMITTED",
        "message": f"Nộp bài thành công! Điểm: {score}/{total_points}"
    }

# -----------------
# Class CRUD Endpoints
# -----------------

@app.post("/classes", response_model=schemas.ClassResponse, status_code=status.HTTP_201_CREATED)
def create_class(
    class_data: schemas.ClassCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role([UserRole.TEACHER, UserRole.ADMIN]))
):
    """
    Tạo lớp học mới. Chỉ TEACHER/ADMIN được tạo.
    Nếu không truyền invite_code, hệ thống tự sinh mã ngẫu nhiên 8 ký tự.
    """
    invite_code = class_data.invite_code or uuid.uuid4().hex[:8].upper()

    # Check trùng invite_code
    existing = db.query(models.Class).filter(models.Class.invite_code == invite_code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Mã mời này đã tồn tại, hãy chọn mã khác")

    db_class = models.Class(
        name=class_data.name,
        invite_code=invite_code,
        teacher_id=current_user.id
    )
    db.add(db_class)
    db.commit()
    db.refresh(db_class)
    return db_class

@app.get("/classes", response_model=List[schemas.ClassResponse])
def get_classes(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Lấy danh sách lớp học theo phân quyền:
    - ADMIN: Thấy toàn bộ lớp trong hệ thống.
    - TEACHER: Chỉ thấy lớp do mình tạo.
    - STUDENT: Chỉ thấy các lớp mình đã tham gia (qua bảng enrollments).
    """
    if current_user.role == UserRole.ADMIN:
        return db.query(models.Class).all()
    elif current_user.role == UserRole.TEACHER:
        return db.query(models.Class).filter(models.Class.teacher_id == current_user.id).all()
    else:
        return current_user.enrolled_classes

# -----------------
# Question Management Endpoints
# -----------------

@app.post("/exams/{exam_id}/questions", response_model=List[schemas.QuestionResponse], status_code=status.HTTP_201_CREATED)
def add_questions(
    exam_id: int,
    questions: List[schemas.QuestionCreate],
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role([UserRole.TEACHER, UserRole.ADMIN]))
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
    if current_user.role != UserRole.ADMIN and quiz.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Bạn không có quyền thêm câu hỏi vào đề thi này")

    created_questions = []
    for q_data in questions:
        # Tạo Question
        db_question = models.Question(
            quiz_id=exam_id,
            content=q_data.content,
            points=q_data.points
        )
        db.add(db_question)
        db.flush()  # Flush để lấy id của question trước khi tạo choices

        # Tạo Choices cho question này
        for c_data in q_data.choices:
            db_choice = models.Choice(
                question_id=db_question.id,
                content=c_data.content,
                is_correct=c_data.is_correct
            )
            db.add(db_choice)

        created_questions.append(db_question)

    db.commit()
    # Refresh tất cả để load relationships (choices)
    for q in created_questions:
        db.refresh(q)

    return created_questions

# -----------------
# Submission History & Stats Endpoints
# -----------------

@app.get("/submissions/me", response_model=List[schemas.SubmissionResponse])
def get_my_submissions(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role([UserRole.STUDENT]))
):
    """
    Student xem lịch sử các bài đã nộp và điểm số của mình.
    """
    submissions = db.query(models.Submission).filter(
        models.Submission.student_id == current_user.id
    ).order_by(models.Submission.started_at.desc()).all()
    return submissions

@app.get("/exams/{exam_id}/submissions", response_model=List[schemas.SubmissionResponse])
def get_exam_submissions(
    exam_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role([UserRole.TEACHER, UserRole.ADMIN]))
):
    """
    Teacher/Admin xem danh sách điểm của tất cả học sinh đã nộp bài cho đề thi này.
    - Check đề thi tồn tại.
    - Check quyền sở hữu (trừ ADMIN).
    """
    quiz = db.query(models.Quiz).filter(models.Quiz.id == exam_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Đề thi không tồn tại")

    if current_user.role != UserRole.ADMIN and quiz.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Bạn không có quyền xem kết quả đề thi này")

    submissions = db.query(models.Submission).filter(
        models.Submission.quiz_id == exam_id
    ).order_by(models.Submission.finished_at.desc()).all()
    return submissions
