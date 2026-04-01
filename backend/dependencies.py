from fastapi import Depends, HTTPException, status, Request, Response
from fastapi.security import OAuth2PasswordBearer, APIKeyHeader
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from database import get_db
from models import User
import schemas
import auth
from config import settings
from redis_mgr import redis_mgr
from security import verify_csrf_token

ACCESS_TOKEN_NAME = "access_token"
REFRESH_TOKEN_NAME = "refresh_token"
CSRF_TOKEN_NAME = "csrf_token"

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login", auto_error=False)
csrf_header = APIKeyHeader(name="X-CSRF-Token", auto_error=False)


def get_auth_cookie_settings() -> dict[str, str | bool]:
    is_prod = settings.is_production
    return {
        "path": "/",
        "secure": is_prod,
        "samesite": "strict" if is_prod else "lax",
    }


def get_token_from_header(request: Request) -> str | None:
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        return auth_header[7:]
    return None


def get_token_from_cookie(request: Request) -> str | None:
    return request.cookies.get(ACCESS_TOKEN_NAME)


def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
):
    if request.method == "OPTIONS":
        raise HTTPException(
            status_code=status.HTTP_200_OK,
            detail="OPTIONS request - no auth needed",
        )

    token = get_token_from_header(request) or get_token_from_cookie(request)

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        username = payload.get("sub")
        jti = payload.get("jti")

        if jti and redis_mgr.is_access_token_blacklisted(str(jti)):
            raise credentials_exception

        if username is None:
            raise credentials_exception

        request.state.access_token = token
        request.state.token_jti = str(jti) if jti else None

        token_data = schemas.TokenData(username=str(username))
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.username == token_data.username).first()
    if user is None:
        raise credentials_exception

    return user


def get_current_user_cookie_only(request: Request, db: Session = Depends(get_db)):
    if request.method == "OPTIONS":
        raise HTTPException(
            status_code=status.HTTP_200_OK,
            detail="OPTIONS request - no auth needed",
        )

    token = get_token_from_cookie(request)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        username = payload.get("sub")
        jti = payload.get("jti")

        if jti and redis_mgr.is_access_token_blacklisted(str(jti)):
            raise credentials_exception

        if username is None:
            raise credentials_exception

        request.state.access_token = token
        request.state.token_jti = str(jti) if jti else None

        token_data = schemas.TokenData(username=str(username))
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.username == token_data.username).first()
    if user is None:
        raise credentials_exception

    return user


def require_csrf(
    request: Request,
    csrf_token: str | None = Depends(csrf_header),
):
    cookie_csrf = request.cookies.get(CSRF_TOKEN_NAME)
    if not csrf_token and not cookie_csrf:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="CSRF token missing",
        )
    valid_token = csrf_token or cookie_csrf
    if not verify_csrf_token(valid_token):  # type: ignore[arg-type]
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid CSRF token",
        )


def require_permissions(required_permissions: list[str]):
    def permission_dependency(current_user: User = Depends(get_current_user)):
        user_perms = set(auth.get_permissions(current_user))
        if "*" in user_perms:
            return current_user
        if not all(perm in user_perms for perm in required_permissions):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return current_user

    return permission_dependency


def create_auth_cookies(
    access_token: str,
    refresh_token: str,
    csrf_token: str,
    access_expires: int,
    refresh_expires: int,
) -> dict:
    # In dev (SQLite), use secure=False & samesite=lax so cookies work
    # across localhost ports (3000→8000) and over non-HTTPS.
    # In production (PostgreSQL), use secure=True & samesite=strict.
    cookie_settings = get_auth_cookie_settings()

    return {
        ACCESS_TOKEN_NAME: {
            "value": access_token,
            "max_age": access_expires * 60,
            "httponly": True,
            **cookie_settings,
        },
        REFRESH_TOKEN_NAME: {
            "value": refresh_token,
            "max_age": refresh_expires * 24 * 3600,
            "httponly": True,
            **cookie_settings,
        },
        CSRF_TOKEN_NAME: {
            "value": csrf_token,
            "max_age": access_expires * 60,
            "httponly": False,
            **cookie_settings,
        },
    }


def clear_auth_cookies() -> dict:
    cookie_settings = get_auth_cookie_settings()

    return {
        ACCESS_TOKEN_NAME: {
            "key": ACCESS_TOKEN_NAME,
            "httponly": True,
            **cookie_settings,
        },
        REFRESH_TOKEN_NAME: {
            "key": REFRESH_TOKEN_NAME,
            "httponly": True,
            **cookie_settings,
        },
        CSRF_TOKEN_NAME: {
            "key": CSRF_TOKEN_NAME,
            "httponly": False,
            **cookie_settings,
        },
    }
