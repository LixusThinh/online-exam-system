from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from datetime import datetime

# Khởi tạo đối tượng DB duy nhất tại đây
db = SQLAlchemy()

# 1. BẢNG NGƯỜI DÙNG (Cho thằng Quang làm Auth)
class User(db.Model, UserMixin):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), default='student') # Phân quyền: 'admin' hoặc 'student'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Quan hệ 1-N: 1 User có nhiều Result (Lịch sử thi)
    results = db.relationship('Result', backref='user', lazy=True)

# 2. BẢNG ĐỀ THI (Cho thằng Thiện lấy thời gian làm Timer)
class Exam(db.Model):
    __tablename__ = 'exams'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    duration = db.Column(db.Integer, nullable=False) # Thời gian làm bài tính bằng Phút
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Xóa đề thi là xóa sạch câu hỏi và kết quả liên quan (Cascade)
    questions = db.relationship('Question', backref='exam', lazy=True, cascade="all, delete-orphan")
    results = db.relationship('Result', backref='exam', lazy=True, cascade="all, delete-orphan")

# 3. BẢNG CÂU HỎI (Nơi mấu chốt để mày chấm điểm)
class Question(db.Model):
    __tablename__ = 'questions'
    id = db.Column(db.Integer, primary_key=True)
    exam_id = db.Column(db.Integer, db.ForeignKey('exams.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    option_a = db.Column(db.String(255), nullable=False)
    option_b = db.Column(db.String(255), nullable=False)
    option_c = db.Column(db.String(255), nullable=False)
    option_d = db.Column(db.String(255), nullable=False)
    correct_answer = db.Column(db.String(1), nullable=False) # Chỉ lưu đúng 1 chữ 'A', 'B', 'C', hoặc 'D'

# 4. BẢNG KẾT QUẢ TỪNG BÀI THI CỦA SINH VIÊN
class Result(db.Model):
    __tablename__ = 'results'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    exam_id = db.Column(db.Integer, db.ForeignKey('exams.id'), nullable=False)
    score = db.Column(db.Float, nullable=False) # Điểm số (ví dụ 8.5)
    total_correct = db.Column(db.Integer, nullable=False) # Số câu đúng
    total_questions = db.Column(db.Integer, nullable=False) # Tổng số câu hỏi
    date_taken = db.Column(db.DateTime, default=datetime.utcnow)