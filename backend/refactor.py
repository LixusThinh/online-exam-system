import re

file_path = "d:/Code_Ca_Nhan/online-exam-system/backend/main.py"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("from models import UserRole\n", "")
content = content.replace("from dependencies import get_current_user, require_role", "from dependencies import get_current_user, require_permissions")

content = content.replace("UserRole.ADMIN", '"admin"')
content = content.replace("UserRole.TEACHER", '"teacher"')
content = content.replace("UserRole.STUDENT", '"student"')

content = content.replace('require_role(["teacher", "admin"])', 'require_permissions(["exam:create"])')
content = content.replace('require_role(["student"])', 'require_permissions(["exam:take"])')

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("done")
