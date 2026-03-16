from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

SQLALCHEMY_DATABASE_URL = "sqlite:///./azota_clone.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# ĐÂY LÀ DÒNG QUAN TRỌNG NHẤT
Base = declarative_base()

# Hàm lấy DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Hàm khởi tạo bảng (Để import bên trong hàm để tránh vòng lặp)
def init_db():
    import models.user
    import models.quiz
    Base.metadata.create_all(bind=engine)