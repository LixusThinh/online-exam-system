from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
import uuid
import secrets
from config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    return pwd_context.hash(password)


ROLE_PERMISSIONS = {
    "admin": ["*"],
    "teacher": [
        "exam:create",
        "exam:read",
        "exam:update",
        "exam:delete",
        "question:manage",
        "submission:read",
        "class:create",
    ],
    "student": [
        "exam:read",
        "exam:take",
        "class:join",
        "submission:create",
        "submission:read_own",
    ],
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
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    to_encode.update({"exp": expire, "jti": str(uuid.uuid4()), "type": "access"})
    encoded_jwt = jwt.encode(
        to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM
    )
    return encoded_jwt


def create_refresh_token_value():
    return secrets.token_urlsafe(64)


def create_refresh_token_data(user_id: int, db=None):
    token_value = create_refresh_token_value()
    expires_delta = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    expires_at = datetime.now(timezone.utc) + expires_delta

    token_data = {
        "sub": str(user_id),
        "jti": str(uuid.uuid4()),
        "type": "refresh",
        "exp": expires_at,
        "token": token_value,
    }
    return token_data, expires_at


def verify_refresh_token(token: str, db=None) -> Optional[dict]:
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        if payload.get("type") != "refresh":
            return None
        return payload
    except JWTError:
        return None
