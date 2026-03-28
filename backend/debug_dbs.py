import sqlite3
import os

dbs = ['backend/sky_exam.db', 'backend/azota_clone.db', 'backend/sql_app.db', 'backend/online_exam_flask.db']

for db_path in dbs:
    if os.path.exists(db_path):
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        print(f"\n--- Checking {db_path} ---")
        try:
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
            tables = [t[0] for t in cursor.fetchall()]
            print(f"Tables: {tables}")
            if 'users' in tables:
                cursor.execute("PRAGMA table_info(users)")
                cols = {info[1]: info[2] for info in cursor.fetchall()}
                print(f"Users Columns: {list(cols.keys())}")
                
                # Check for teacher1 with dynamic column names
                username_col = 'username' if 'username' in cols else 'user'
                role_col = 'role'
                
                print(f"Fixing roles in {db_path}...")
                cursor.execute(f"UPDATE users SET {role_col} = LOWER({role_col})")
                conn.commit()
                
                cursor.execute(f"SELECT {username_col}, {role_col} FROM users WHERE {username_col}='teacher1'")
                res = cursor.fetchone()
                if res:
                    print(f"(!!!) FIXED teacher1 in {db_path}: {res}")
        except Exception as e:
            print(f"Error in {db_path}: {e}")
        conn.close()
    else:
        print(f"{db_path} not found.")
