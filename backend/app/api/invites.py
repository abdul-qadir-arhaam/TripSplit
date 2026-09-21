from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.invite import (
    InvitePreviewResponse,
    InviteGuestJoinRequest,
)
from app.schemas.trip import TripDetailResponse, TripGuestJoinResponse
from app.services.invite_service import invite_service

router = APIRouter(prefix="/invites", tags=["Invites"])


@router.get("/{token}", response_model=InvitePreviewResponse)
def preview_invite(
    token: str,
    db: Session = Depends(get_db),
):
    """
    Publicly preview trip invitation details using the cryptographic invite token or code.
    No authentication required.
    """
    return invite_service.preview_invite(db, token)


@router.post("/{token}/join", response_model=TripDetailResponse)
def join_via_invite_token(
    token: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Join a trip as an authenticated registered user via a cryptographic invite token or code.
    Increments invite use count and validates expiration and active status.
    """
    return invite_service.join_via_token(db, current_user, token)


@router.post("/{token}/join-guest", response_model=TripGuestJoinResponse)
def join_guest_via_invite_token(
    token: str,
    payload: InviteGuestJoinRequest,
    db: Session = Depends(get_db),
):
    """
    Join a trip as an anonymous guest with a display name via an invite token.
    Issues a cryptographically signed guest session credential.
    """
    return invite_service.join_guest_via_token(db, token, payload)
