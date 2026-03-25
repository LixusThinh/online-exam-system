import sys
import os

# Thêm thư mục hiện tại vào sys.path để import các module local
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from database import SessionLocal
from models import User, UserRole, Class, Quiz, Question, Choice
from auth import get_password_hash

def seed():
    db: Session = SessionLocal()
    try:
        print("--- BẮT ĐẦU CHIẾN DỊCH 'BƠM ĐẠN' (SEEDING) ---")
        
        # Kiểm tra xem đã có data chưa để tránh trùng lặp nếu chạy lại
        existing_user = db.query(User).filter(User.username == "teacher1").first()
        if existing_user:
            print("(!) Dữ liệu demo đã tồn tại. Đang xóa để làm mới...")
            # Xóa theo thứ tự để tránh lỗi khóa ngoại
            db.query(Choice).delete()
            db.query(Question).delete()
            db.query(Quiz).delete()
            db.query(Class).delete()
            db.query(User).delete()
            db.commit()

        # 1. Tạo 3 Tài Khoản (Pass: 123456)
        password_hash = get_password_hash("123456")
        
        admin = User(username="admin", hashed_password=password_hash, role=UserRole.ADMIN, full_name="Hệ Thống Admin")
        teacher = User(username="teacher1", hashed_password=password_hash, role=UserRole.TEACHER, full_name="Lão Sư Giáo Viên")
        student = User(username="student1", hashed_password=password_hash, role=UserRole.STUDENT, full_name="Học Sinh Ưu Tú")
        
        db.add_all([admin, teacher, student])
        db.commit()
        db.refresh(teacher)
        print("[+] Đã tạo 3 tài khoản: admin, teacher1, student1 (Pass: 123456)")
        
        # 2. Tạo Lớp Học
        new_class = Class(name="Lớp 12A1 - HUTECH", invite_code="HUTECHVIP", teacher_id=teacher.id)
        db.add(new_class)
        db.commit()
        db.refresh(new_class)
        print(f"[+] Đã tạo lớp: {new_class.name} (Mã mời: {new_class.invite_code})")
        
        # 3. Tạo Đề Thi
        exam = Quiz(
            title="BÀI THI TEST MẮT THẦN (ANTI-CHEAT)",
            time_limit=15,
            teacher_id=teacher.id,
            class_id=new_class.id
        )
        db.add(exam)
        db.commit()
        db.refresh(exam)
        print(f"[+] Đã tạo đề thi: {exam.title} (15 phút)")
        
        # 4. Tạo Câu Hỏi 1
        q1 = Question(
            quiz_id=exam.id,
            content="1 + 1 bằng mấy?",
            points=5.0
        )
        db.add(q1)
        db.commit()
        db.refresh(q1)
        
        c1_1 = Choice(question_id=q1.id, content="1", is_correct=False)
        c1_2 = Choice(question_id=q1.id, content="2", is_correct=True)
        c1_3 = Choice(question_id=q1.id, content="3", is_correct=False)
        db.add_all([c1_1, c1_2, c1_3])
        print("[+] Đã thêm Câu hỏi 1: Toán học cơ bản")
        
        # Tạo Câu Hỏi 2
        q2 = Question(
            quiz_id=exam.id,
            content="Đặc điểm quan trọng nhất của hệ thống SKY-EXAM là gì?",
            points=5.0
        )
        db.add(q2)
        db.commit()
        db.refresh(q2)
        
        c2_1 = Choice(question_id=q2.id, content="Giao diện Cyberpunk", is_correct=False)
        c2_2 = Choice(question_id=q2.id, content="Chống gian lận WebSocket (Mắt Thần)", is_correct=True)
        c2_3 = Choice(question_id=q2.id, content="Có pháo hoa khi nộp bài", is_correct=False)
        db.add_all([c2_1, c2_2, c2_3])
        print("[+] Đã thêm Câu hỏi 2: Tính năng cốt lõi")
        
        db.commit()
        print("\n=> CHIẾN DỊCH 'BƠM ĐẠN' THÀNH CÔNG! Lão đại có thể múa Demo ngay.")
        
    except Exception as e:
        db.rollback()
        print(f"\n[!] Bơm đạn THẤT BẠI: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
