from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.trip import Trip
from app.models.trip_member import TripMember
from app.schemas.trip import TripCreate, TripUpdate


class TripRepository:
    def get_by_id(self, db: Session, trip_id: str) -> Optional[Trip]:
        return db.query(Trip).filter(Trip.id == trip_id).first()

    def get_trips_for_user(self, db: Session, user_id: str) -> List[Trip]:
        """Return all trips where the user is either owner or an active trip member."""
        owned_trips = db.query(Trip).filter(Trip.owner_id == user_id).all()
        member_trips = (
            db.query(Trip)
            .join(TripMember, Trip.id == TripMember.trip_id)
            .filter(TripMember.user_id == user_id, TripMember.status == "ACTIVE")
            .all()
        )
        # Deduplicate preserving order
        seen_ids = set()
        result = []
        for t in owned_trips + member_trips:
            if t.id not in seen_ids:
                seen_ids.add(t.id)
                result.append(t)
        return result

    def create(self, db: Session, trip_in: TripCreate, owner_id: str, owner_display_name: str) -> Trip:
        trip = Trip(
            name=trip_in.name.strip(),
            destination=trip_in.destination.strip(),
            description=trip_in.description.strip() if trip_in.description else None,
            start_date=trip_in.start_date,
            end_date=trip_in.end_date,
            budget=trip_in.budget,
            currency=trip_in.currency.upper(),
            trip_type=trip_in.trip_type,
            owner_id=owner_id,
            status="PLANNING",
        )
        db.add(trip)
        db.commit()
        db.refresh(trip)

        # Automatically add the creator as OWNER trip member
        self.add_member(
            db=db,
            trip_id=trip.id,
            user_id=owner_id,
            display_name=owner_display_name,
            role="OWNER",
            member_type="REGISTERED",
        )
        return trip

    def update(self, db: Session, trip: Trip, updates: TripUpdate) -> Trip:
        if updates.name is not None:
            trip.name = updates.name.strip()
        if updates.destination is not None:
            trip.destination = updates.destination.strip()
        if updates.description is not None:
            trip.description = updates.description.strip()
        if updates.start_date is not None:
            trip.start_date = updates.start_date
        if updates.end_date is not None:
            trip.end_date = updates.end_date
        if updates.budget is not None:
            trip.budget = updates.budget
        if updates.currency is not None:
            trip.currency = updates.currency.upper()
        if updates.trip_type is not None:
            trip.trip_type = updates.trip_type
        if updates.status is not None:
            trip.status = updates.status.upper()

        trip.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(trip)
        return trip

    def delete(self, db: Session, trip: Trip) -> None:
        db.delete(trip)
        db.commit()

    def add_member(
        self,
        db: Session,
        trip_id: str,
        user_id: Optional[str],
        display_name: str,
        role: str = "MEMBER",
        member_type: str = "REGISTERED",
        guest_token_hash: Optional[str] = None,
    ) -> TripMember:
        if user_id:
            existing = self.get_member_by_user_id(db, trip_id, user_id)
            if existing:
                if existing.status != "ACTIVE":
                    existing.status = "ACTIVE"
                    db.commit()
                    db.refresh(existing)
                return existing

        member = TripMember(
            trip_id=trip_id,
            user_id=user_id,
            display_name=display_name.strip(),
            role=role,
            member_type=member_type,
            guest_token_hash=guest_token_hash,
            status="ACTIVE",
            joined_at=datetime.now(timezone.utc),
        )
        db.add(member)
        db.commit()
        db.refresh(member)
        return member

    def remove_member(self, db: Session, trip_id: str, member_id: str) -> bool:
        member = (
            db.query(TripMember)
            .filter(TripMember.trip_id == trip_id, TripMember.id == member_id)
            .first()
        )
        if member:
            member.status = "INACTIVE"
            db.commit()
            return True
        return False

    def get_member_by_user_id(self, db: Session, trip_id: str, user_id: str) -> Optional[TripMember]:
        return (
            db.query(TripMember)
            .filter(TripMember.trip_id == trip_id, TripMember.user_id == user_id)
            .first()
        )

    def get_member_by_id(self, db: Session, member_id: str) -> Optional[TripMember]:
        return db.query(TripMember).filter(TripMember.id == member_id).first()

    def get_guest_member(self, db: Session, trip_id: str, member_id: str) -> Optional[TripMember]:
        return (
            db.query(TripMember)
            .filter(
                TripMember.trip_id == trip_id,
                TripMember.id == member_id,
                TripMember.member_type == "GUEST",
                TripMember.status == "ACTIVE",
            )
            .first()
        )

    def convert_guest_to_registered(
        self,
        db: Session,
        member: TripMember,
        user_id: str,
        display_name: str
    ) -> TripMember:
        """Convert an existing guest member into a registered user member, keeping history intact."""
        member.user_id = user_id
        member.member_type = "REGISTERED"
        member.display_name = display_name
        member.guest_token_hash = None
        member.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(member)
        return member


trip_repository = TripRepository()

