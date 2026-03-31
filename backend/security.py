import secrets
import hashlib
from typing import Optional
from datetime import timedelta, datetime, timezone


def generate_csrf_token() -> str:
    token = secrets.token_urlsafe(32)
    signature = hashlib.sha256((token + "csrf_secret").encode()).hexdigest()
    return f"{token}.{signature}"


def verify_csrf_token(token: str) -> bool:
    if not token or "." not in token:
        return False
    parts = token.rsplit(".", 1)
    if len(parts) != 2:
        return False
    token_part, signature = parts
    expected_signature = hashlib.sha256(
        (token_part + "csrf_secret").encode()
    ).hexdigest()
    return secrets.compare_digest(signature, expected_signature)


def generate_state_token() -> str:
    return secrets.token_urlsafe(32)


def verify_state_token(state: str, expected: Optional[str]) -> bool:
    if not state or not expected:
        return False
    return secrets.compare_digest(state, expected)
