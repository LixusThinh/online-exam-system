import sys
import os

# Thêm thư mục hiện tại vào sys.path để import các module local
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from database import engine
from sqlalchemy import text

def fix():
    with engine.connect() as conn:
        print("Đang chuẩn hóa Role sang chữ thường...")
        try:
            conn.execute(text("UPDATE users SET role = LOWER(role);"))
            conn.commit()
            print("Đã chuyển toàn bộ Role sang chữ thường (lowercase)!")
        except Exception as e:
            print(f"Lỗi khi update role: {e}")
        
        # Kiểm tra lại teacher1
        res = conn.execute(text("SELECT username, role FROM users WHERE username = 'teacher1'")).fetchone()
        if res:
            print(f"Xác nhận: User '{res[0]}' hiện có Role là '{res[1]}'")
        else:
            print("Không tìm thấy user teacher1 để verify.")

if __name__ == "__main__":
    fix()
