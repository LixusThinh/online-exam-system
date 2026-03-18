from sqlalchemy import Column, Integer, String, Enum
from sqlalchemy.orm import relationship
import enum
from database import Base

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    TEACHER = "teacher"
    STUDENT = "student"

class User(Base):
    __tablename__ = "users"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    role = Column(Enum(UserRole), default=UserRole.STUDENT)

    # Relationships
    classes = relationship("Class", back_populates="teacher")
    quizzes = relationship("Quiz", back_populates="teacher")
    submissions = relationship("Submission", back_populates="student")