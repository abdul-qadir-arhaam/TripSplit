import hashlib
import secrets
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Tuple
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.trip import Trip
from app.models.trip_invite import TripInvite
from app.repositories.invite_repository import invite_repository
from app.repositories.trip_repository import trip_repository
from app.schemas.invite import (
    InviteCreate,
    InviteResponse,
    InvitePreviewResponse,
    InviteGuestJoinRequest,
)
from app.schemas.trip import TripDetailResponse, TripGuestJoinResponse
from app.services.trip_service import trip_service


def hash_token(raw_token: str) -> str:
    """Generate SHA-256 hash of raw invite token."""
    return hashlib.sha256(raw_token.strip().encode("utf-8")).hexdigest()


def check_invite_status(invite: TripInvite) -> Tuple[bool, bool]:
    """
    Returns (is_valid, is_expired).
    is_valid is True only if active, not expired, and under max_uses.
    """
    if not invite.is_active:
        return False, False

    now = datetime.now(timezone.utc)
    if invite.expires_at:
        exp = invite.expires_at
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)
        if exp <= now:
            return False, True

    if invite.max_uses is not None and invite.use_count >= invite.max_uses:
        return False, False

    return True, False


class InviteService:
    def _to_invite_response(self, invite: TripInvite, token: Optional[str] = None) -> InviteResponse:
        _, is_expired = check_invite_status(invite)
        return InviteResponse(
            id=invite.id,
            trip_id=invite.trip_id,
            code=invite.code,
            token=token,
            expires_at=invite.expires_at,
            max_uses=invite.max_uses,
            use_count=invite.use_count,
            is_active=invite.is_active,
            require_approval=invite.require_approval,
            created_at=invite.created_at,
            updated_at=invite.updated_at,
            created_by_id=invite.created_by_id,
            is_expired=is_expired,
        )

    def generate_invite(
        self,
        db: Session,
        user: User,
        trip_id: str,
        payload: InviteCreate,
    ) -> InviteResponse:
        trip = trip_repository.get_by_id(db, trip_id)
        if not trip:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Trip not found."
            )

        # Only trip owner or active trip members can generate an invite link (PRD: Trip owner/organizer)
        if trip.owner_id != user.id:
            # Check if active member
            is_member = any(m.user_id == user.id and m.status == "ACTIVE" for m in trip.members)
            if not is_member:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You do not have permission to generate invites for this trip."
                )

        # Generate cryptographically secure URL-safe token
        raw_token = secrets.token_urlsafe(32)
        token_hash = hash_token(raw_token)
        code = secrets.token_hex(6)

        expires_at = None
        if payload.expires_in_days:
            expires_at = datetime.now(timezone.utc) + timedelta(days=payload.expires_in_days)

        invite = invite_repository.create(
            db=db,
            trip_id=trip.id,
            created_by_id=user.id,
            code=code,
            token_hash=token_hash,
            expires_at=expires_at,
            max_uses=payload.max_uses,
            require_approval=payload.require_approval,
        )

        return self._to_invite_response(invite, token=raw_token)

    def list_trip_invites(self, db: Session, user: User, trip_id: str) -> List[InviteResponse]:
        trip = trip_repository.get_by_id(db, trip_id)
        if not trip:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Trip not found."
            )

        # Owner or members can view invite links
        is_member = any(m.user_id == user.id and m.status == "ACTIVE" for m in trip.members)
        if trip.owner_id != user.id and not is_member:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to view invites for this trip."
            )

        invites = invite_repository.list_by_trip(db, trip_id)
        return [self._to_invite_response(inv) for inv in invites]

    def get_or_create_active_invite(self, db: Session, user: User, trip_id: str) -> InviteResponse:
        """Get the active valid invite for a trip, or create a default one if none exists."""
        trip = trip_repository.get_by_id(db, trip_id)
        if not trip:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Trip not found."
            )

        is_member = any(m.user_id == user.id and m.status == "ACTIVE" for m in trip.members)
        if trip.owner_id != user.id and not is_member:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access invites for this trip."
            )

        # Look for existing active valid invite
        existing = invite_repository.get_active_by_trip(db, trip_id)
        if existing:
            return self._to_invite_response(existing)

        # Otherwise create a default 30-day invite
        return self.generate_invite(
            db=db,
            user=user,
            trip_id=trip_id,
            payload=InviteCreate(expires_in_days=30),
        )

    def disable_invite(self, db: Session, user: User, trip_id: str, invite_id: str) -> InviteResponse:
        trip = trip_repository.get_by_id(db, trip_id)
        if not trip:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Trip not found."
            )

        # Only owner can disable invites
        if trip.owner_id != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the trip owner can disable invite links."
            )

        invite = invite_repository.get_by_id(db, invite_id)
        if not invite or invite.trip_id != trip.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invite not found for this trip."
            )

        updated = invite_repository.disable(db, invite)
        return self._to_invite_response(updated)

    def regenerate_invite(self, db: Session, user: User, trip_id: str, invite_id: str) -> InviteResponse:
        trip = trip_repository.get_by_id(db, trip_id)
        if not trip:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Trip not found."
            )

        # Only owner can regenerate invites
        if trip.owner_id != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the trip owner can regenerate invite links."
            )

        invite = invite_repository.get_by_id(db, invite_id)
        if not invite or invite.trip_id != trip.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invite not found for this trip."
            )

        # Generate fresh token and code
        raw_token = secrets.token_urlsafe(32)
        token_hash = hash_token(raw_token)
        new_code = secrets.token_hex(6)

        # Renew expiry if it had an expiration
        expires_at = None
        if invite.expires_at:
            # Default to 30 days renewal
            expires_at = datetime.now(timezone.utc) + timedelta(days=30)

        updated = invite_repository.update_token(
            db=db,
            invite=invite,
            new_code=new_code,
            new_token_hash=token_hash,
            expires_at=expires_at,
            max_uses=invite.max_uses,
        )

        return self._to_invite_response(updated, token=raw_token)

    def _find_invite_by_token_or_code(self, db: Session, token_or_code: str) -> Optional[TripInvite]:
        # First attempt: hash incoming token
        th = hash_token(token_or_code)
        inv = invite_repository.get_by_token_hash(db, th)
        if inv:
            return inv

        # Second attempt: check if token_or_code is a short code
        inv_code = invite_repository.get_by_code(db, token_or_code.strip())
        if inv_code:
            return inv_code

        return None

    def preview_invite(self, db: Session, token: str) -> InvitePreviewResponse:
        invite = self._find_invite_by_token_or_code(db, token)
        if not invite:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invite link is invalid or not found."
            )

        trip = trip_repository.get_by_id(db, invite.trip_id)
        if not trip:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Trip not found."
            )

        is_valid, is_expired = check_invite_status(invite)
        active_members = [m for m in trip.members if m.status == "ACTIVE"]
        owner_name = trip.owner.name if trip.owner else "Organizer"

        return InvitePreviewResponse(
            trip_id=trip.id,
            name=trip.name,
            destination=trip.destination,
            description=trip.description,
            start_date=trip.start_date,
            end_date=trip.end_date,
            trip_type=trip.trip_type,
            owner_name=owner_name,
            member_count=len(active_members),
            is_valid=is_valid,
            is_expired=is_expired,
            is_active=invite.is_active,
            expires_at=invite.expires_at,
            max_uses=invite.max_uses,
            use_count=invite.use_count,
        )

    def join_via_token(self, db: Session, user: User, token: str) -> TripDetailResponse:
        invite = self._find_invite_by_token_or_code(db, token)
        if not invite:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invite link is invalid or not found."
            )

        is_valid, is_expired = check_invite_status(invite)
        if is_expired:
            raise HTTPException(
                status_code=status.HTTP_410_GONE,
                detail="This invite link has expired. Please request a new invite from the trip organizer."
            )
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This invite link has reached its maximum uses or is no longer active."
            )

        # Check if already a member
        existing = trip_repository.get_member_by_user_id(db, invite.trip_id, user.id)
        if existing and existing.status == "ACTIVE":
            trip = trip_repository.get_by_id(db, invite.trip_id)
            return trip_service._to_detail_response(trip)

        # Add member to trip
        detail = trip_service.join_trip(db, user, invite.trip_id)

        # Increment usage
        invite_repository.increment_use_count(db, invite)

        return detail

    def join_guest_via_token(
        self,
        db: Session,
        token: str,
        payload: InviteGuestJoinRequest,
    ) -> TripGuestJoinResponse:
        invite = self._find_invite_by_token_or_code(db, token)
        if not invite:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invite link is invalid or not found."
            )

        is_valid, is_expired = check_invite_status(invite)
        if is_expired:
            raise HTTPException(
                status_code=status.HTTP_410_GONE,
                detail="This invite link has expired. Please request a new invite from the trip organizer."
            )
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This invite link has reached its maximum uses or is no longer active."
            )

        # Add guest to trip
        res = trip_service.join_trip_as_guest(db, invite.trip_id, payload.display_name)

        # Increment usage
        invite_repository.increment_use_count(db, invite)

        return res


invite_service = InviteService()
