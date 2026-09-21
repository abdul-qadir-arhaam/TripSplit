from dataclasses import dataclass
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.trip_member import TripMember
from app.repositories.user_repository import user_repository
from app.security.tokens import decode_access_token
from app.security.guest_auth import decode_guest_token, hash_guest_token

security = HTTPBearer(auto_error=False)


@dataclass
class AuthActor:
    is_guest: bool
    user: Optional[User] = None
    guest_member: Optional[TripMember] = None
    trip_id: Optional[str] = None
    display_name: str = ""
    member_id: Optional[str] = None


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Dependency that extracts and validates the JWT Bearer token, returning the authenticated User."""
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in.",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token.",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload.",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    user = user_repository.get_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User associated with token no longer exists.",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    return user


def get_current_actor(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> AuthActor:
    """
    Dependency that extracts either a registered user JWT or a guest session JWT.
    Enables hybrid endpoints to serve both registered users and isolated guests.
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in or join as a guest.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    token = credentials.credentials

    # 1. Try decoding as guest token
    guest_payload = decode_guest_token(token)
    if guest_payload:
        member_id = guest_payload.get("sub")
        trip_id = guest_payload.get("trip_id")
        if member_id and trip_id:
            member = (
                db.query(TripMember)
                .filter(
                    TripMember.id == member_id,
                    TripMember.trip_id == trip_id,
                    TripMember.status == "ACTIVE",
                )
                .first()
            )
            if member and member.member_type == "GUEST":
                # Verify token hash if stored
                if member.guest_token_hash:
                    expected_hash = hash_guest_token(token)
                    if member.guest_token_hash != expected_hash:
                        raise HTTPException(
                            status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Guest session has been revoked or converted.",
                            headers={"WWW-Authenticate": "Bearer"}
                        )
                return AuthActor(
                    is_guest=True,
                    guest_member=member,
                    trip_id=trip_id,
                    display_name=member.display_name,
                    member_id=member.id,
                )

    # 2. Try decoding as registered user token
    user_payload = decode_access_token(token)
    if user_payload:
        user_id = user_payload.get("sub")
        if user_id:
            user = user_repository.get_by_id(db, user_id)
            if user:
                return AuthActor(
                    is_guest=False,
                    user=user,
                    display_name=user.name,
                    member_id=None,
                )

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired authentication credentials.",
        headers={"WWW-Authenticate": "Bearer"}
    )

