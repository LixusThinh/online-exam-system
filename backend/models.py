from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, Enum, DateTime, Table, JSON
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.sql import func
import enum
from database import Base

# Bảng trung gian Nhiều-Nhiều: Sinh viên <-> Lớp học
enrollments = Table(
    "enrollments",
    Base.metadata,
    Column("student_id", Integer, ForeignKey("users.id"), primary_key=True),
    Column("class_id", Integer, ForeignKey("classes.id"), primary_key=True),
)


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    TEACHER = "teacher"
    STUDENT = "student"

class SubmissionStatus(str, enum.Enum):
    IN_PROGRESS = "in_progress"
    SUBMITTED = "submitted"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    role: Mapped[str] = mapped_column(
        String(20), 
        nullable=False,
        default="student"
    )
    permissions = Column(JSON, default=list)

    # Quan hệ 1-N: Teacher sở hữu Class / Quiz
    classes = relationship("Class", back_populates="teacher")
    quizzes = relationship("Quiz", back_populates="teacher")
    submissions = relationship("Submission", back_populates="student")

    # Quan hệ N-N: Sinh viên tham gia nhiều Lớp
    enrolled_classes = relationship("Class", secondary=enrollments, back_populates="students")

class Class(Base):
    __tablename__ = "classes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), index=True, nullable=False)
    invite_code = Column(String(20), unique=True, index=True)
    teacher_id = Column(Integer, ForeignKey("users.id"))

    teacher = relationship("User", back_populates="classes")
    quizzes = relationship("Quiz", back_populates="classroom")

    # Quan hệ N-N: Lớp có nhiều Sinh viên
    students = relationship("User", secondary=enrollments, back_populates="enrolled_classes")

class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    time_limit = Column(Integer) # Phút
    password = Column(String, nullable=True)
    teacher_id = Column(Integer, ForeignKey("users.id"))
    class_id = Column(Integer, ForeignKey("classes.id"))

    teacher = relationship("User", back_populates="quizzes")
    classroom = relationship("Class", back_populates="quizzes")
    questions = relationship("Question", back_populates="quiz", cascade="all, delete-orphan")

class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"))
    content = Column(String, nullable=False)
    points = Column(Float, default=1.0)

    quiz = relationship("Quiz", back_populates="questions")
    choices = relationship("Choice", back_populates="question", cascade="all, delete-orphan")

class Choice(Base):
    __tablename__ = "choices"

    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("questions.id"))
    content = Column(String, nullable=False)
    is_correct = Column(Boolean, default=False)

    question = relationship("Question", back_populates="choices")

class Submission(Base):
    __tablename__ = "submissions"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"))
    quiz_id = Column(Integer, ForeignKey("quizzes.id"))
    score = Column(Float, nullable=True)
    status = Column(Enum(SubmissionStatus), default=SubmissionStatus.IN_PROGRESS)
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    finished_at = Column(DateTime(timezone=True), onupdate=func.now())
    cheat_count = Column(Integer, default=0)

    student = relationship("User", back_populates="submissions")
