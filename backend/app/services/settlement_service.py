from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional, List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.settlement import Settlement
from app.models.trip import Trip
from app.models.trip_member import TripMember
from app.dependencies import AuthActor
from app.repositories.trip_repository import trip_repository
from app.repositories.settlement_repository import settlement_repository
from app.schemas.settlement import (
    SettlementCreate,
    SettlementUpdate,
    SettlementResponse,
    SettlementListResponse,
    SettlementsSummary,
)


class SettlementService:
    def _verify_actor_in_trip(self, db: Session, actor: AuthActor, trip_id: str) -> tuple[Trip, Optional[TripMember]]:
        trip = trip_repository.get_by_id(db, trip_id)
        if not trip:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Trip not found.",
            )

        if actor.is_guest:
            if actor.trip_id != trip.id or not actor.guest_member or actor.guest_member.status != "ACTIVE":
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Guests can only access their assigned trip.",
                )
            return trip, actor.guest_member

        user = actor.user
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required.",
            )

        member = (
            db.query(TripMember)
            .filter(
                TripMember.trip_id == trip.id,
                TripMember.user_id == user.id,
                TripMember.status == "ACTIVE",
            )
            .first()
        )
        if not member and trip.owner_id != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not a member of this trip.",
            )

        return trip, member

    def _to_response(self, s: Settlement) -> SettlementResponse:
        from_name = s.from_member.display_name if s.from_member else "Unknown"
        to_name = s.to_member.display_name if s.to_member else "Unknown"
        return SettlementResponse(
            id=s.id,
            trip_id=s.trip_id,
            from_member_id=s.from_member_id,
            from_member_name=from_name,
            to_member_id=s.to_member_id,
            to_member_name=to_name,
            amount=s.amount,
            currency=s.currency or "INR",
            status=s.status,
            payment_date=s.payment_date,
            payment_method=s.payment_method,
            notes=s.notes,
            created_by_member_id=s.created_by_member_id,
            created_at=s.created_at,
            updated_at=s.updated_at,
        )

    def record_settlement(
        self,
        db: Session,
        actor: AuthActor,
        trip_id: str,
        data: SettlementCreate,
    ) -> SettlementResponse:
        trip, caller_member = self._verify_actor_in_trip(db, actor, trip_id)

        if data.from_member_id == data.to_member_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Sender and receiver cannot be the same member.",
            )

        # Validate from_member
        from_member = (
            db.query(TripMember)
            .filter(TripMember.id == data.from_member_id, TripMember.trip_id == trip.id)
            .first()
        )
        if not from_member or from_member.status != "ACTIVE":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Debtor (paying member) is not an active member of this trip.",
            )

        # Validate to_member
        to_member = (
            db.query(TripMember)
            .filter(TripMember.id == data.to_member_id, TripMember.trip_id == trip.id)
            .first()
        )
        if not to_member or to_member.status != "ACTIVE":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Creditor (receiving member) is not an active member of this trip.",
            )

        payment_date = data.payment_date
        if data.status == "PAID" and payment_date is None:
            payment_date = datetime.now(timezone.utc)

        settlement = Settlement(
            trip_id=trip.id,
            from_member_id=data.from_member_id,
            to_member_id=data.to_member_id,
            amount=data.amount,
            currency=data.currency or trip.currency or "INR",
            status=data.status,
            payment_date=payment_date,
            payment_method=data.payment_method,
            notes=data.notes,
            created_by_member_id=caller_member.id if caller_member else None,
        )

        created = settlement_repository.create(db, settlement)
        # Fetch with relationships loaded
        reloaded = settlement_repository.get_by_id(db, created.id)
        return self._to_response(reloaded or created)

    def list_settlements(
        self,
        db: Session,
        actor: AuthActor,
        trip_id: str,
        status_filter: Optional[str] = None,
    ) -> SettlementListResponse:
        self._verify_actor_in_trip(db, actor, trip_id)
        settlements = settlement_repository.list_for_trip(db, trip_id, status=status_filter)
        summary_data = settlement_repository.get_summary_for_trip(db, trip_id)

        return SettlementListResponse(
            settlements=[self._to_response(s) for s in settlements],
            summary=SettlementsSummary(**summary_data),
        )

    def get_settlement(
        self,
        db: Session,
        actor: AuthActor,
        trip_id: str,
        settlement_id: str,
    ) -> SettlementResponse:
        self._verify_actor_in_trip(db, actor, trip_id)
        settlement = settlement_repository.get_by_id(db, settlement_id)
        if not settlement or settlement.trip_id != trip_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Settlement record not found.",
            )
        return self._to_response(settlement)

    def update_settlement(
        self,
        db: Session,
        actor: AuthActor,
        trip_id: str,
        settlement_id: str,
        data: SettlementUpdate,
    ) -> SettlementResponse:
        trip, caller_member = self._verify_actor_in_trip(db, actor, trip_id)
        settlement = settlement_repository.get_by_id(db, settlement_id)
        if not settlement or settlement.trip_id != trip_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Settlement record not found.",
            )

        updates = {}
        if data.status is not None:
            updates["status"] = data.status
            if data.status == "PAID" and settlement.payment_date is None and data.payment_date is None:
                updates["payment_date"] = datetime.now(timezone.utc)

        if data.payment_date is not None:
            updates["payment_date"] = data.payment_date
        if data.payment_method is not None:
            updates["payment_method"] = data.payment_method
        if data.notes is not None:
            updates["notes"] = data.notes

        updated = settlement_repository.update(db, settlement, updates)
        return self._to_response(updated)

    def delete_settlement(
        self,
        db: Session,
        actor: AuthActor,
        trip_id: str,
        settlement_id: str,
    ) -> None:
        trip, caller_member = self._verify_actor_in_trip(db, actor, trip_id)
        settlement = settlement_repository.get_by_id(db, settlement_id)
        if not settlement or settlement.trip_id != trip_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Settlement record not found.",
            )

        caller_id = caller_member.id if caller_member else None
        is_creator = caller_id and settlement.created_by_member_id == caller_id
        is_debtor = caller_id and settlement.from_member_id == caller_id
        is_owner = actor.user and trip.owner_id == actor.user.id

        if not (is_creator or is_debtor or is_owner):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to delete this settlement record.",
            )

        settlement_repository.delete(db, settlement)


settlement_service = SettlementService()
