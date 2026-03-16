from sqlalchemy import Column, Integer, Float, String, ForeignKey
from sqlalchemy.orm import relationship
from . import Base
import enum
from sqlalchemy import Enum as SQLEnum

class SubmissionStatus(str, enum.Enum):
    IN_PROGRESS = "IN_PROGRESS"
    SUBMITTED = "SUBMITTED"

class Submission(Base):
    __tablename__ = "submissions"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"))
    quiz_id = Column(Integer, ForeignKey("quizzes.id"))
    score = Column(Float, nullable=True)
    status = Column(SQLEnum(SubmissionStatus), default=SubmissionStatus.IN_PROGRESS, nullable=False)

    student = relationship("User", back_populates="submissions")
    quiz = relationship("Quiz", back_populates="submissions")
