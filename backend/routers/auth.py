from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta

from database import get_db
from models.user import User
import auth as auth_utils

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", status_code=status.HTTP_200_OK)
def login(response: Response, form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """
    API Đăng nhập: Kiểm tra thông tin, tạo JWT và set HttpOnly cookie trả về cho client.
    """
    # Tìm user trong database
    user = db.query(User).filter(User.username == form_data.username).first()
    
    # Kiểm tra tồn tại và password có khớp không
    if not user or not auth_utils.verify_password(form_data.password, getattr(user, 'hashed_password', getattr(user, 'password', ''))):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    # Tạo JWT (thời hạn 60 phút theo yêu cầu)
    access_token_expires = timedelta(minutes=60)
    access_token = auth_utils.create_access_token(
        data={"sub": user.username, "role": user.role}, expires_delta=access_token_expires
    )
    
    # Set HttpOnly Cookie trả về cho frontend Next.js
    response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        httponly=True,
        max_age=3600,
        samesite="lax",
    )
    
    return {"access_token": access_token, "token_type": "bearer", "role": user.role}

@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout(response: Response):
    """
    API Đăng xuất: Xóa bỏ HttpOnly cookie chứa JWT
    """
    # Xoá cookie
    response.delete_cookie(key="access_token", httponly=True, samesite="lax")
    
    return {"message": "Đăng xuất thành công"}

