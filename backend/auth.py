from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
import uuid
from config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

ROLE_PERMISSIONS = {
    "admin": ["*"],
    "teacher": ["exam:create", "exam:read", "exam:update", "exam:delete", "question:manage", "submission:read", "class:create"],
    "student": ["exam:read", "exam:take", "class:join", "submission:create", "submission:read_own"]
}

def get_permissions(user):
    perms = set(ROLE_PERMISSIONS.get(user.role, []))
    if user.permissions:
        perms.update(user.permissions)
    return list(perms)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        # Lão đại testing, cho sống 24 tiếng luôn cho đỡ phiền
        expire = datetime.now(timezone.utc) + timedelta(minutes=1440)
    to_encode.update({
        "exp": expire,
        "jti": str(uuid.uuid4())
    })
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt
