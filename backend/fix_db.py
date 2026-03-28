from database import engine
from sqlalchemy import text

def fix_db():
    with engine.connect() as connection:
        print("Đang kiểm tra kết nối database...")
        try:
            # Check if column exists first to avoid error if re-run
            # Postgres specific: ADD COLUMN IF NOT EXISTS
            print("Đang thêm cột 'permissions' vào bảng 'users'...")
            connection.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '[]';"))
            connection.commit()
            print("Thành công! Cột 'permissions' đã được thêm.")
        except Exception as e:
            print(f"Lỗi: {e}")
            print("Thử lại với cú pháp chuẩn hơn nếu IF NOT EXISTS lỗi...")
            try:
                connection.execute(text("ALTER TABLE users ADD COLUMN permissions JSONB DEFAULT '[]';"))
                connection.commit()
                print("Thành công!")
            except Exception as e2:
                print(f"Vẫn lỗi: {e2}")
        
        print("Đang đồng bộ hóa Role về chữ thường (lowercase)...")
        connection.execute(text("UPDATE users SET role = LOWER(role);"))
        connection.commit()
        print("Đã chuyển toàn bộ Role sang chữ thường!")

if __name__ == "__main__":
    fix_db()
