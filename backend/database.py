from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker

# Database URL format: database_backend://user:password@host/database_name
# Adjust based on whether you use SQLite, PostgreSQL, etc.
DATABASE_URL = "sqlite:///./online_exam.db"

engine = create_engine(
    DATABASE_URL, 
    connect_args={"check_same_thread": False} # Needed only for SQLite
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
