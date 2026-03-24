from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from database import get_db
from models import User
import schemas
import auth
from config import settings
from redis_mgr import redis_mgr

# Define the OAuth2 scheme for token extraction
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """
    Dependency to get the current authenticated user from the JWT token.
    Throws a 401 Unauthorized if the token is invalid or user doesn't exist.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        jti: str = payload.get("jti")
        
        if jti and redis_mgr.is_token_blacklisted(jti):
            raise credentials_exception
            
        # Keep permissions in request state if needed, or re-fetch from user
        if username is None:
            raise credentials_exception
        token_data = schemas.TokenData(username=username)
    except JWTError:
        raise credentials_exception

    # Query the user from the database
    user = db.query(User).filter(User.username == token_data.username).first()
    if user is None:
        raise credentials_exception
    
   
        
    return user

def require_permissions(required_permissions: list[str]):
    """
    Dependency generator for Attribute-Based Access Control (ABAC).
    Returns a dependency that checks if the current user has ALL of the required permissions.
    """
    def permission_dependency(current_user: User = Depends(get_current_user)):
        user_perms = set(auth.get_permissions(current_user))
        
        # If user has wildcard permission, grant access
        if "*" in user_perms:
            return current_user
            
        # Check if user has all required permissions
        if not all(perm in user_perms for perm in required_permissions):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Xinh xít! Lão đại ơi, con hàng này đéo đủ thẩm quyền để vào đây!"
            )
        return current_user
    return permission_dependency
