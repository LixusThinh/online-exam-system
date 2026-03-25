import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from database import SessionLocal
from models import User, UserRole
from auth import get_password_hash

def add_students():
    db: Session = SessionLocal()
    try:
        password_hash = get_password_hash("123456")
        
        student2 = User(username="student2", hashed_password=password_hash, role=UserRole.STUDENT, full_name="Học Sinh Giỏi 2")
        student3 = User(username="student3", hashed_password=password_hash, role=UserRole.STUDENT, full_name="Học Sinh Khá 3")
        student4 = User(username="student4", hashed_password=password_hash, role=UserRole.STUDENT, full_name="Học Sinh Kém 4")
        
        # Check if they exist to avoid unique constraint errors
        existing = [u.username for u in db.query(User).filter(User.username.in_(["student2", "student3", "student4"])).all()]
        
        added = 0
        if "student2" not in existing:
            db.add(student2)
            added += 1
        if "student3" not in existing:
            db.add(student3)
            added += 1
        if "student4" not in existing:
            db.add(student4)
            added += 1
            
        if added > 0:
            db.commit()
            print(f"Đã tạo thêm {added} tài khoản student thành công!")
        else:
            print("Các tài khoản student2, student3, student4 đã tồn tại sẵn.")
            
    except Exception as e:
        db.rollback()
        print(f"Lỗi: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    add_students()
