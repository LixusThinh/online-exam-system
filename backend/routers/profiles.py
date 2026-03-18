from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from dependencies import get_current_user
from models.user import User

router = APIRouter(prefix="/profiles", tags=["Profiles"])

# Schema cho payload request
class StudentProfileCreate(BaseModel):
    full_name: str
    class_name: str

@router.post("/student", status_code=status.HTTP_201_CREATED)
async def create_student_profile(
    profile_data: StudentProfileCreate,
    current_user: User = Depends(get_current_user)
):
    """
    API Tạo Profile. Chỉ Giáo viên hoặc Admin mới được phép.
    """
    # Authorization: Kiểm tra xem Role có được phép không
    # Note: `current_user.role` is an Enum value, we can compare its string value or the enum
    if current_user.role.value == "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tài khoản học sinh không có quyền tạo profile. Chức năng dành cho Giáo viên."
        )

    # Nếu được phép (teacher/admin) -> thực hiện logic và lưu db.
    return {
        "message": "Tạo profile học sinh thành công!",
        "data": profile_data.model_dump(),
        "created_by": current_user.username
    }
