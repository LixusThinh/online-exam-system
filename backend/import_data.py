import os
import sys
import pandas as pd

# --- BƯỚC 1: CẤU HÌNH ĐƯỜNG DẪN ---
sys.path.append(os.getcwd())
sys.stdout.reconfigure(encoding='utf-8')

# --- KHÔNG CÒN HACK MAGIC FIX ---
# Import bình thường từ database.py và models.py chuẩn SQLAlchemy 2.0
from database import SessionLocal, init_db
from models import Question, Choice

def run_import(file_path="questions.xlsx"):
    print(f"🚀 Đang đọc file: '{file_path}'...")
    
    if not os.path.exists(file_path):
        return False, 0, f"Không tìm thấy file {file_path}"
        
    try:
        df = pd.read_excel(file_path)
    except Exception as e:
        return False, 0, f"Lỗi đọc Excel: {e}"
        
    # Đảm bảo các bảng đã được tạo
    init_db()
    
    db = SessionLocal()
    imported_count = 0
    
    try:
        for idx, row in df.iterrows():
            content = str(row.get('content', '')).strip()
            if not content or content == 'nan': continue
            
            quiz_id = int(row.get('quiz_id', 1))
            
            # Tạo Question
            new_q = Question(content=content, quiz_id=quiz_id)
            db.add(new_q)
            db.flush() # Lấy ID của câu hỏi vừa tạo để gán cho các Choice
            
            # Xử lý các đáp án (Choice)
            choice_cols = [c for c in df.columns if str(c).startswith('choice_')]
            correct_val = str(row.get('correct_answer', '')).strip()
            
            for i, col in enumerate(choice_cols, 1):
                c_text = str(row[col]).strip()
                if c_text and c_text != 'nan':
                    is_correct = (correct_val == str(i) or correct_val.lower() == c_text.lower())
                    
                    new_choice = Choice(
                        content=c_text, 
                        is_correct=is_correct, 
                        question_id=new_q.id
                    )
                    db.add(new_choice)
            
            db.commit()
            imported_count += 1
            print(f"✅ Đã nhập: {content[:30]}...")

    except Exception as e:
        db.rollback()
        return False, imported_count, f"Lỗi tại dòng {idx}: {e}"
    finally:
        db.close()
        
    return True, imported_count, "Import thành công rực rỡ!"

if __name__ == "__main__":
    success, count, msg = run_import("questions.xlsx")
    print("\n" + "="*40)
    print(f"TRẠNG THÁI: {msg}")
    print(f"TỔNG CỘNG: {count} câu hỏi đã vào DB")
    print("="*40)