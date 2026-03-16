from sqlalchemy.orm import declarative_base

Base = declarative_base()

# Models will be imported and registered here
from .user import User, UserRole
from .classes import Class
from .quiz import Quiz
from .question import Question, Choice
from .submission import Submission, SubmissionStatus
