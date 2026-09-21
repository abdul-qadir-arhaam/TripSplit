import hashlib
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
import jwt
from app.config import settings

GUEST_TOKEN_EXPIRE_DAYS = 30


def generate_guest_token(trip_id: str, member_id: str, display_name: str) -> str:
    """Generate a signed JWT for a guest participant tied to a specific trip."""
    expire = datetime.now(timezone.utc) + timedelta(days=GUEST_TOKEN_EXPIRE_DAYS)
    payload: Dict[str, Any] = {
        "sub": str(member_id),
        "trip_id": str(trip_id),
        "display_name": display_name,
        "type": "guest",
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def hash_guest_token(token: str) -> str:
    """Compute a SHA-256 hash of the guest token for verification and revocation."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def decode_guest_token(token: str) -> Optional[Dict[str, Any]]:
    """Decode and validate a guest token. Returns payload dict or None if invalid."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("type") != "guest":
            return None
        return payload
    except (jwt.PyJWTError, Exception):
        return None
