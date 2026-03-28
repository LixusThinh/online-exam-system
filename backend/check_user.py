from database import SessionLocal
from models import User

def check():
    db = SessionLocal()
    users = db.query(User).all()
    for user in users:
        if user.role:
            old_role = user.role
            user.role = user.role.lower()
            if old_role != user.role:
                print(f"Fixed user {user.username}: {old_role} -> {user.role}")
    db.commit()
    print("All roles normalized.")
    db.close()

if __name__ == "__main__":
    check()
