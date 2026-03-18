from flask import Flask, request, jsonify
from models import db, User, Exam, Question, Result # Import các model theo mô tả của Đốc Đại ca

import os

app = Flask(__name__)
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'online_exam_flask.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

# --- BẮT ĐẦU PHẦN API ROUTES ---

@app.route('/api/exam/<int:exam_id>', methods=['GET'])
def get_exam(exam_id):
    """
    API 1: Lấy thông tin đề thi và danh sách câu hỏi.
    - Không trả về correct_answer.
    - Trả về 404 nếu không tìm thấy đề thi.
    """
    try:
        # Truy vấn thông tin Exam, lấy luôn Question con của Exam đấy (giả định relationship 'questions')
        exam = Exam.query.get(exam_id)
        
        # Xử lý nếu Đéo tìm thấy đề thi
        if not exam:
            return jsonify({"error": "Không tìm thấy đề thi với ID này."}), 404
        
        # Mảng chứa danh sách câu hỏi sạch (Đã ẩn đúng/sai)
        safe_questions = []
        for q in exam.questions: # Giả định trong model Exam có relationship: questions = db.relationship('Question', backref='exam')
            safe_questions.append({
                "id": q.id,
                "content": q.content,
                "option_a": q.option_a,
                "option_b": q.option_b,
                "option_c": q.option_c,
                "option_d": q.option_d
            })
            
        # Trả về JSON chuẩn chỉ cho Front-end (thằng Thiện)
        return jsonify({
            "exam_title": exam.exam_title,
            "duration": exam.duration, # Front-end lấy để làm đồng hồ đếm ngược
            "questions": safe_questions
        }), 200

    except Exception as e:
        return jsonify({"error": f"Lỗi server: {str(e)}"}), 500


@app.route('/api/submit_exam', methods=['POST'])
def submit_exam():
    """
    API 2: Nộp bài, chấm điểm tự động và lưu db.
    Payload mong đợi: 
    {
        "user_id": 1, 
        "exam_id": 2, 
        "answers": {"1": "A", "2": "C", "3": "B"} 
    }
    """
    try:
        data = request.get_json()
        
        # Validate data gửi lên xem có ngu (bị thiếu field) hay không
        if not data or 'user_id' not in data or 'exam_id' not in data or 'answers' not in data:
            return jsonify({"error": "Dữ liệu không hợp lệ (Bad Request). Phải có form {user_id, exam_id, answers}"}), 400
            
        user_id = data['user_id']
        exam_id = data['exam_id']
        user_answers = data['answers'] # dict type { string_id : "A/B/C/D" }
        
        # Kiểm tra xem Exam có tồn tại không
        exam = Exam.query.get(exam_id)
        if not exam:
            return jsonify({"error": "Không tìm thấy đề thi."}), 404
            
        total_questions = len(exam.questions)
        if total_questions == 0:
            return jsonify({"error": "Đề thi nay chưa có câu hỏi nào (total_questions = 0)."}), 400

        total_correct = 0
        
        # Chạy vòng lặp để chấm điểm
        for q in exam.questions:
            # key trong user_answers từ chuỗi json thường mang kiểu string ("1", "2")
            question_id_str = str(q.id)
            
            # Lấy đáp án của người dùng (nếu nó đếu chọn => None)
            user_choice = user_answers.get(question_id_str)
            
            # So sánh - uppercase cho an toàn
            if user_choice and str(user_choice).strip().upper() == str(q.correct_answer).strip().upper():
                total_correct += 1
                
        # Tính toán điểm theo thang 10 (làm tròn 2 chữ số)
        score = round((total_correct / total_questions) * 10, 2)
        
        # Lưu vào bảng Result
        new_result = Result(
            user_id=user_id,
            exam_id=exam_id,
            score=score,
            total_correct=total_correct,
            total_questions=total_questions
        )
        db.session.add(new_result)
        db.session.commit()
        
        # Trả về kết quả
        return jsonify({
            "message": "Thành công",
            "score": score,
            "total_correct": total_correct,
            "total_questions": total_questions
        }), 200
        
    except Exception as e:
        db.session.rollback() # Có lỗi thì rollback database liền
        return jsonify({"error": f"Lỗi server: {str(e)}"}), 500

# --- KẾT THÚC PHẦN API ROUTES ---

if __name__ == '__main__':
    app.run(debug=True)
