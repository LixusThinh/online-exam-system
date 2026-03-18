from sqlalchemy import Column, Integer, String, Float, ForeignKey, JSON
from sqlalchemy.orm import relationship
from database import Base

class Exam(Base):
    __tablename__ = "exams"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)

    questions = relationship("models.exam.Question", back_populates="exam", cascade="all, delete-orphan")
    results = relationship("models.exam.Result", back_populates="exam", cascade="all, delete-orphan")

class Question(Base):
    __tablename__ = "questions"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    exam_id = Column(Integer, ForeignKey("exams.id"), nullable=False)
    content = Column(String, nullable=False)
    options = Column(JSON, nullable=False) # e.g. {"A": "Option 1", "B": "Option 2"}
    correct_option = Column(String, nullable=False) # e.g. "A"

    exam = relationship("models.exam.Exam", back_populates="questions")

class Result(Base):
    __tablename__ = "results"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    exam_id = Column(Integer, ForeignKey("exams.id"), nullable=False)
    score = Column(Float, nullable=False)

    exam = relationship("models.exam.Exam", back_populates="results")
    user = relationship("models.user.User", backref="exam_results")
