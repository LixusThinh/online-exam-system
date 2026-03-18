from app import app, db  # Thay 'app' bằng tên file chính của mày nếu khác
from models import User, Exam, Question
from werkzeug.security import generate_password_hash

def seed_data():
    with app.app_context():
        print("Đang dọn dẹp và bơm data giả vào DB... Đợi tí Lão đại!")
        
        # (Tùy chọn) Xóa sạch làm lại từ đầu nếu mày muốn reset DB
        db.drop_all()
        db.create_all()

        # 1. Bơm 1 thằng User test (nếu chưa có)
        user = User.query.filter_by(username='thinh_test').first()
        if not user:
            user = User(
                username='thinh_test', 
                email='thinh_test@vinhomes.com', 
                password_hash=generate_password_hash('123456'), 
                role='student'
            )
            db.session.add(user)
            db.session.commit() # Commit để lấy user.id

        # 2. Bơm 1 cái Đề thi
        exam = Exam(
            title='Đề thi thử Cấu trúc Dữ liệu & Python', 
            description='Đề này để test 2 cái API Core', 
            duration=45
        )
        db.session.add(exam)
        db.session.commit() # Commit để lấy exam.id

        # 3. Bơm 3 câu hỏi cho đề thi vừa tạo
        q1 = Question(
            exam_id=exam.id, 
            content='Trong Python, từ khóa nào dùng để định nghĩa một hàm?', 
            option_a='func', option_b='def', option_c='function', option_d='define', 
            correct_answer='B'
        )
        q2 = Question(
            exam_id=exam.id, 
            content='Đâu là HTTP Method thường dùng để nộp form/dữ liệu lên server?', 
            option_a='GET', option_b='DELETE', option_c='POST', option_d='OPTIONS', 
            correct_answer='C'
        )
        q3 = Question(
            exam_id=exam.id, 
            content='Lỗi 404 Not Found có ý nghĩa gì?', 
            option_a='Server bị sập', option_b='Mật khẩu sai', option_c='Không có quyền truy cập', option_d='Không tìm thấy trang/tài nguyên', 
            correct_answer='D'
        )

        db.session.add_all([q1, q2, q3])
        db.session.commit()

        print(f"Xong cmnr! Bơm thành công User ID: {user.id} | Exam ID: {exam.id} | 3 Câu hỏi.")

if __name__ == '__main__':
    seed_data()