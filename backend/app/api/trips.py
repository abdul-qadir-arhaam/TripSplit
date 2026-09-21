from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_user, get_current_actor, AuthActor
from app.models.user import User
from app.schemas.trip import (
    TripCreate,
    TripUpdate,
    TripResponse,
    TripDetailResponse,
    TripMemberAdd,
    TripInviteInfoResponse,
    TripGuestJoin,
    TripGuestAdd,
    TripGuestJoinResponse,
    TripGuestConvert,
    TripGuestConvertResponse,
    TripGuestSessionResponse,
)
from app.services.trip_service import trip_service

router = APIRouter(prefix="/trips", tags=["Trips"])


@router.get("", response_model=List[TripResponse])
def get_user_trips(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """List all trips where user is owner or active member (registered users only)."""
    return trip_service.get_user_trips(db, current_user)


@router.post("", response_model=TripDetailResponse, status_code=status.HTTP_201_CREATED)
def create_trip(
    trip_in: TripCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new trip and attach the owner plus any selected initial friends/members."""
    return trip_service.create_trip(db, current_user, trip_in)


@router.get("/{trip_id}", response_model=TripDetailResponse)
def get_trip_details(
    trip_id: str,
    actor: AuthActor = Depends(get_current_actor),
    db: Session = Depends(get_db)
):
    """Get full details of a trip. Supports registered members and guest members with isolation."""
    return trip_service.get_trip_detail_for_actor(db, actor, trip_id)


@router.patch("/{trip_id}", response_model=TripDetailResponse)
def update_trip(
    trip_id: str,
    updates: TripUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update trip details (owner only)."""
    return trip_service.update_trip(db, current_user, trip_id, updates)


@router.delete("/{trip_id}")
def delete_trip(
    trip_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a trip (owner only)."""
    trip_service.delete_trip(db, current_user, trip_id)
    return {"message": "Trip deleted successfully."}


@router.post("/{trip_id}/members", response_model=TripDetailResponse)
def add_trip_member(
    trip_id: str,
    member_in: TripMemberAdd,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a registered friend/user to the trip."""
    return trip_service.add_member(db, current_user, trip_id, member_in.user_id)


@router.post("/{trip_id}/members/guest", response_model=TripDetailResponse)
def add_direct_guest_member(
    trip_id: str,
    guest_in: TripGuestAdd,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Allow trip owner/members to add a companion directly by name as a guest member."""
    return trip_service.add_direct_guest_member(db, current_user, trip_id, guest_in.display_name)


@router.delete("/{trip_id}/members/{member_id}", response_model=TripDetailResponse)
def remove_trip_member(
    trip_id: str,
    member_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove a member from the trip."""
    return trip_service.remove_member(db, current_user, trip_id, member_id)


@router.get("/{trip_id}/invite", response_model=TripInviteInfoResponse)
def get_trip_invite_info(
    trip_id: str,
    db: Session = Depends(get_db)
):
    """Publicly preview trip invitation info (trip name, destination, dates, organizer)."""
    return trip_service.get_trip_invite_info(db, trip_id)


@router.post("/{trip_id}/join", response_model=TripDetailResponse)
def join_trip(
    trip_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Join a trip as a registered member via invitation."""
    return trip_service.join_trip(db, current_user, trip_id)


@router.post("/{trip_id}/join-guest", response_model=TripGuestJoinResponse)
def join_trip_as_guest(
    trip_id: str,
    guest_in: TripGuestJoin,
    db: Session = Depends(get_db)
):
    """Join a trip as a guest with a display name without creating an account."""
    return trip_service.join_trip_as_guest(db, trip_id, guest_in.display_name)


@router.post("/{trip_id}/convert-guest", response_model=TripGuestConvertResponse)
def convert_guest_to_account(
    trip_id: str,
    payload: TripGuestConvert,
    actor: AuthActor = Depends(get_current_actor),
    db: Session = Depends(get_db)
):
    """Convert a guest participant into a registered user account while preserving all records."""
    return trip_service.convert_guest_to_account(db, actor, trip_id, payload)


@router.get("/{trip_id}/guest-session", response_model=TripGuestSessionResponse)
def get_guest_session_info(
    trip_id: str,
    actor: AuthActor = Depends(get_current_actor),
    db: Session = Depends(get_db)
):
    """Validate and get current guest participant session info."""
    return trip_service.get_guest_session_info(db, actor, trip_id)

