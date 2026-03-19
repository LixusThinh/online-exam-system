from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

SQLALCHEMY_DATABASE_URL = "sqlite:///./azota_clone.db"

# Khởi tạo engine
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

# Khởi tạo SessionLocal
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Khởi tạo Base chuẩn SQLAlchemy 2.0
Base = declarative_base()

# Dependency function dùng cho FastAPI
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    # Phải import models vào đây để Base nhận diện được các bảng trước khi tạo DB
    import models
    Base.metadata.create_all(bind=engine)