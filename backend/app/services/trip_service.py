from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.trip import Trip
from app.dependencies import AuthActor
from app.security.guest_auth import generate_guest_token, hash_guest_token
from app.security.password import hash_password, verify_password
from app.security.tokens import create_access_token
from app.schemas.user import UserResponse
from app.schemas.trip import (
    TripCreate,
    TripUpdate,
    TripResponse,
    TripDetailResponse,
    TripMemberResponse,
    TripInviteInfoResponse,
    TripGuestJoinResponse,
    TripGuestConvert,
    TripGuestConvertResponse,
    TripGuestSessionResponse,
)
from app.repositories.trip_repository import trip_repository
from app.repositories.user_repository import user_repository


class TripService:
    def _to_member_response(self, m) -> TripMemberResponse:
        u = m.user
        return TripMemberResponse(
            id=m.id,
            trip_id=m.trip_id,
            user_id=m.user_id,
            display_name=m.display_name,
            member_type=m.member_type,
            role=m.role,
            status=m.status,
            joined_at=m.joined_at,
            email=u.email if u else None,
            profile_photo=u.profile_photo if u else None,
        )

    def _to_detail_response(self, trip: Trip) -> TripDetailResponse:
        active_members = [m for m in trip.members if m.status == "ACTIVE"]
        return TripDetailResponse(
            id=trip.id,
            name=trip.name,
            destination=trip.destination,
            description=trip.description,
            start_date=trip.start_date,
            end_date=trip.end_date,
            budget=trip.budget,
            currency=trip.currency,
            trip_type=trip.trip_type,
            owner_id=trip.owner_id,
            status=trip.status,
            member_count=len(active_members),
            created_at=trip.created_at,
            updated_at=trip.updated_at,
            members=[self._to_member_response(m) for m in active_members],
        )

    def create_trip(self, db: Session, user: User, data: TripCreate) -> TripDetailResponse:
        trip = trip_repository.create(
            db=db,
            trip_in=data,
            owner_id=user.id,
            owner_display_name=user.name,
        )

        # Attach additional selected members if any
        if data.member_user_ids:
            for uid in data.member_user_ids:
                if uid != user.id:
                    member_user = user_repository.get_by_id(db, uid)
                    if member_user:
                        trip_repository.add_member(
                            db=db,
                            trip_id=trip.id,
                            user_id=member_user.id,
                            display_name=member_user.name,
                            role="MEMBER",
                            member_type="REGISTERED",
                        )

        # Refresh trip to load all members
        db.refresh(trip)
        return self._to_detail_response(trip)

    def get_user_trips(self, db: Session, user: User) -> List[TripResponse]:
        trips = trip_repository.get_trips_for_user(db, user.id)
        result = []
        for t in trips:
            active_count = sum(1 for m in t.members if m.status == "ACTIVE")
            result.append(
                TripResponse(
                    id=t.id,
                    name=t.name,
                    destination=t.destination,
                    description=t.description,
                    start_date=t.start_date,
                    end_date=t.end_date,
                    budget=t.budget,
                    currency=t.currency,
                    trip_type=t.trip_type,
                    owner_id=t.owner_id,
                    status=t.status,
                    member_count=active_count,
                    created_at=t.created_at,
                    updated_at=t.updated_at,
                )
            )
        return result

    def get_trip_detail(self, db: Session, user: User, trip_id: str) -> TripDetailResponse:
        trip = trip_repository.get_by_id(db, trip_id)
        if not trip:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Trip not found."
            )
        # Check authorization: user must be owner or active member
        is_member = any(m.user_id == user.id and m.status == "ACTIVE" for m in trip.members)
        if trip.owner_id != user.id and not is_member:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this trip."
            )
        return self._to_detail_response(trip)

    def get_trip_detail_for_actor(self, db: Session, actor: AuthActor, trip_id: str) -> TripDetailResponse:
        trip = trip_repository.get_by_id(db, trip_id)
        if not trip:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Trip not found."
            )
        
        if actor.is_guest:
            # Enforce strict guest isolation: guests can only access their assigned trip
            if actor.trip_id != trip.id or not actor.guest_member or actor.guest_member.status != "ACTIVE":
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Guests can only access their assigned trip."
                )
        else:
            user = actor.user
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required."
                )
            is_member = any(m.user_id == user.id and m.status == "ACTIVE" for m in trip.members)
            if trip.owner_id != user.id and not is_member:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You do not have access to this trip."
                )
        return self._to_detail_response(trip)

    def update_trip(self, db: Session, user: User, trip_id: str, updates: TripUpdate) -> TripDetailResponse:
        trip = trip_repository.get_by_id(db, trip_id)
        if not trip:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Trip not found."
            )
        if trip.owner_id != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the trip owner can update trip settings."
            )
        updated = trip_repository.update(db, trip, updates)
        return self._to_detail_response(updated)

    def delete_trip(self, db: Session, user: User, trip_id: str) -> None:
        trip = trip_repository.get_by_id(db, trip_id)
        if not trip:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Trip not found."
            )
        if trip.owner_id != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the trip owner can delete this trip."
            )
        trip_repository.delete(db, trip)

    def add_member(self, db: Session, user: User, trip_id: str, target_user_id: str) -> TripDetailResponse:
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
                detail="You do not have permission to add members to this trip."
            )

        target_user = user_repository.get_by_id(db, target_user_id)
        if not target_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found."
            )

        trip_repository.add_member(
            db=db,
            trip_id=trip.id,
            user_id=target_user.id,
            display_name=target_user.name,
            role="MEMBER",
            member_type="REGISTERED",
        )
        db.refresh(trip)
        return self._to_detail_response(trip)

    def add_direct_guest_member(
        self,
        db: Session,
        user: User,
        trip_id: str,
        display_name: str
    ) -> TripDetailResponse:
        """Allow trip owner or member to directly add a companion by name as a guest."""
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
                detail="You do not have permission to add members to this trip."
            )
        clean_name = display_name.strip()
        if not clean_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Display name cannot be blank."
            )

        trip_repository.add_member(
            db=db,
            trip_id=trip.id,
            user_id=None,
            display_name=clean_name,
            role="MEMBER",
            member_type="GUEST",
        )
        db.refresh(trip)
        return self._to_detail_response(trip)

    def remove_member(self, db: Session, user: User, trip_id: str, member_id: str) -> TripDetailResponse:
        trip = trip_repository.get_by_id(db, trip_id)
        if not trip:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Trip not found."
            )

        target_member = trip_repository.get_member_by_id(db, member_id)
        if not target_member or target_member.trip_id != trip.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Member not found in this trip."
            )

        # Owner can remove anyone; member can remove themselves (leave trip)
        if trip.owner_id != user.id and target_member.user_id != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only remove yourself from this trip."
            )

        if target_member.role == "OWNER":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The trip owner cannot be removed. Delete the trip instead."
            )

        trip_repository.remove_member(db, trip.id, member_id)
        db.refresh(trip)
        return self._to_detail_response(trip)

    def get_trip_invite_info(self, db: Session, trip_id: str) -> TripInviteInfoResponse:
        trip = trip_repository.get_by_id(db, trip_id)
        if not trip:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Trip not found."
            )
        active_members = [m for m in trip.members if m.status == "ACTIVE"]
        owner_name = trip.owner.name if trip.owner else "Organizer"
        return TripInviteInfoResponse(
            id=trip.id,
            name=trip.name,
            destination=trip.destination,
            description=trip.description,
            start_date=trip.start_date,
            end_date=trip.end_date,
            trip_type=trip.trip_type,
            owner_name=owner_name,
            member_count=len(active_members),
            status=trip.status,
        )

    def join_trip(self, db: Session, user: User, trip_id: str) -> TripDetailResponse:
        trip = trip_repository.get_by_id(db, trip_id)
        if not trip:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Trip not found."
            )
        existing = trip_repository.get_member_by_user_id(db, trip.id, user.id)
        if existing and existing.status == "ACTIVE":
            return self._to_detail_response(trip)

        trip_repository.add_member(
            db=db,
            trip_id=trip.id,
            user_id=user.id,
            display_name=user.name,
            role="MEMBER",
            member_type="REGISTERED",
        )
        db.refresh(trip)
        return self._to_detail_response(trip)

    def join_trip_as_guest(self, db: Session, trip_id: str, display_name: str) -> TripGuestJoinResponse:
        trip = trip_repository.get_by_id(db, trip_id)
        if not trip:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Trip not found."
            )
        clean_name = display_name.strip()
        if not clean_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Guest display name cannot be blank."
            )

        # Create guest member record
        member = trip_repository.add_member(
            db=db,
            trip_id=trip.id,
            user_id=None,
            display_name=clean_name,
            role="MEMBER",
            member_type="GUEST",
        )

        # Generate signed guest credential & store hash
        token = generate_guest_token(trip_id=trip.id, member_id=member.id, display_name=clean_name)
        member.guest_token_hash = hash_guest_token(token)
        db.commit()
        db.refresh(member)
        db.refresh(trip)

        return TripGuestJoinResponse(
            guest_token=token,
            member=self._to_member_response(member),
            trip=self._to_detail_response(trip),
        )

    def convert_guest_to_account(
        self,
        db: Session,
        actor: AuthActor,
        trip_id: str,
        payload: TripGuestConvert
    ) -> TripGuestConvertResponse:
        """
        Converts an active guest participant into a registered user.
        Preserves all historical trip links, expenses, balances, and avoids duplicate members.
        """
        trip = trip_repository.get_by_id(db, trip_id)
        if not trip:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Trip not found."
            )
        
        if not actor.is_guest or not actor.guest_member:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Active guest session is required to perform guest-to-account conversion."
            )

        if actor.trip_id != trip.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Guest session does not match this trip."
            )

        guest_member = actor.guest_member
        if guest_member.member_type != "GUEST" or guest_member.status != "ACTIVE":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Member is already registered or inactive."
            )

        # Check if email is already registered
        existing_user = user_repository.get_by_email(db, payload.email)
        if existing_user:
            if not verify_password(payload.password, existing_user.password_hash):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="An account with this email already exists and password was incorrect."
                )
            target_user = existing_user
            # Ensure target_user is not already a separate member of this trip
            existing_membership = trip_repository.get_member_by_user_id(db, trip.id, target_user.id)
            if existing_membership and existing_membership.id != guest_member.id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="This user account is already a separate member of this trip."
                )
        else:
            # Register new user
            display_name = (payload.name or guest_member.display_name).strip()
            target_user = user_repository.create(
                db=db,
                name=display_name,
                email=payload.email,
                password_hash=hash_password(payload.password),
            )

        # Convert the TripMember record preserving its id, joined_at, and historical associations
        converted = trip_repository.convert_guest_to_registered(
            db=db,
            member=guest_member,
            user_id=target_user.id,
            display_name=target_user.name,
        )

        # Issue standard access token
        access_token = create_access_token(target_user.id)

        return TripGuestConvertResponse(
            message="Guest successfully converted to registered member.",
            access_token=access_token,
            user=UserResponse.model_validate(target_user),
            member=self._to_member_response(converted),
        )

    def get_guest_session_info(
        self,
        db: Session,
        actor: AuthActor,
        trip_id: str
    ) -> TripGuestSessionResponse:
        """Validate that the current guest session is active for this trip."""
        if not actor.is_guest or not actor.guest_member or actor.trip_id != trip_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not an active guest session for this trip."
            )
        return TripGuestSessionResponse(
            member=self._to_member_response(actor.guest_member),
            trip_id=trip_id,
            is_guest=True,
        )


trip_service = TripService()

