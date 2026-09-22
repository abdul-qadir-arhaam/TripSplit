from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.expense import Expense
from app.models.expense_split import ExpenseSplit
from app.models.trip import Trip
from app.models.trip_member import TripMember
from app.dependencies import AuthActor
from app.repositories.trip_repository import trip_repository
from app.repositories.expense_repository import expense_repository
from app.schemas.expense import (
    ExpenseCreate,
    ExpenseUpdate,
    ExpenseResponse,
    ExpenseDetailResponse,
    ExpenseSplitResponse,
    SplitItemInput,
)
from app.services.split_calculator import calculate_and_validate_splits


class ExpenseService:
    def _verify_actor_in_trip(self, db: Session, actor: AuthActor, trip_id: str) -> tuple[Trip, TripMember]:
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
        
        # If user is owner but not in trip_members (safety fallback), fetch owner member
        if not member:
            member = (
                db.query(TripMember)
                .filter(TripMember.trip_id == trip.id, TripMember.role == "OWNER")
                .first()
            )

        return trip, member

    def _to_split_response(self, s: ExpenseSplit) -> ExpenseSplitResponse:
        m = s.member
        return ExpenseSplitResponse(
            id=s.id,
            expense_id=s.expense_id,
            member_id=s.member_id,
            amount=s.amount,
            split_value=s.split_value,
            member_display_name=m.display_name if m else "Unknown",
            member_type=m.member_type if m else "REGISTERED",
        )

    def _to_response(self, e: Expense) -> ExpenseResponse:
        payer = e.paid_by
        return ExpenseResponse(
            id=e.id,
            trip_id=e.trip_id,
            title=e.title,
            amount=e.amount,
            currency=e.currency,
            category=e.category,
            paid_by_member_id=e.paid_by_member_id,
            paid_by_name=payer.display_name if payer else "Unknown",
            split_method=e.split_method,
            expense_date=e.expense_date,
            location_name=e.location_name,
            notes=e.notes,
            receipt_url=e.receipt_url,
            created_by_member_id=e.created_by_member_id,
            created_at=e.created_at,
            updated_at=e.updated_at,
            split_count=len(e.splits) if e.splits else 0,
        )

    def _to_detail_response(self, e: Expense) -> ExpenseDetailResponse:
        base = self._to_response(e)
        splits = [self._to_split_response(s) for s in (e.splits or [])]
        return ExpenseDetailResponse(
            **base.model_dump(),
            splits=splits,
        )

    def create_expense(
        self,
        db: Session,
        actor: AuthActor,
        trip_id: str,
        data: ExpenseCreate,
    ) -> ExpenseDetailResponse:
        trip, caller_member = self._verify_actor_in_trip(db, actor, trip_id)

        # Check payer exists and is active in trip
        payer = (
            db.query(TripMember)
            .filter(
                TripMember.id == data.paid_by_member_id,
                TripMember.trip_id == trip.id,
                TripMember.status == "ACTIVE",
            )
            .first()
        )
        if not payer:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Payer is not an active member of this trip.",
            )

        active_members = (
            db.query(TripMember)
            .filter(TripMember.trip_id == trip.id, TripMember.status == "ACTIVE")
            .all()
        )
        active_member_ids = {m.id for m in active_members}

        # Calculate splits with precision
        calculated_splits = calculate_and_validate_splits(
            amount=data.amount,
            split_method=data.split_method,
            splits_input=data.splits,
            active_member_ids=active_member_ids,
        )

        expense = Expense(
            trip_id=trip.id,
            title=data.title.strip(),
            amount=data.amount,
            currency=data.currency or trip.currency or "INR",
            category=data.category or "Miscellaneous",
            paid_by_member_id=data.paid_by_member_id,
            split_method=data.split_method,
            expense_date=data.expense_date or datetime.now(timezone.utc),
            location_name=data.location_name.strip() if data.location_name else None,
            notes=data.notes.strip() if data.notes else None,
            receipt_url=data.receipt_url.strip() if data.receipt_url else None,
            created_by_member_id=caller_member.id if caller_member else None,
        )

        split_models = [
            ExpenseSplit(
                member_id=cs.member_id,
                amount=cs.amount,
                split_value=cs.split_value,
            )
            for cs in calculated_splits
        ]

        created = expense_repository.create(db, expense, split_models)
        return self._to_detail_response(created)

    def list_expenses(
        self,
        db: Session,
        actor: AuthActor,
        trip_id: str,
        category: Optional[str] = None,
        payer_id: Optional[str] = None,
        search: Optional[str] = None,
        sort_by: str = "date",
        order: str = "desc",
    ) -> List[ExpenseResponse]:
        self._verify_actor_in_trip(db, actor, trip_id)
        expenses = expense_repository.list_for_trip(
            db=db,
            trip_id=trip_id,
            category=category,
            payer_id=payer_id,
            search=search,
            sort_by=sort_by,
            order=order,
        )
        return [self._to_response(e) for e in expenses]

    def get_expense_detail(
        self,
        db: Session,
        actor: AuthActor,
        trip_id: str,
        expense_id: str,
    ) -> ExpenseDetailResponse:
        self._verify_actor_in_trip(db, actor, trip_id)
        expense = expense_repository.get_by_id(db, expense_id)
        if not expense or expense.trip_id != trip_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Expense not found in this trip.",
            )
        return self._to_detail_response(expense)

    def update_expense(
        self,
        db: Session,
        actor: AuthActor,
        trip_id: str,
        expense_id: str,
        updates: ExpenseUpdate,
    ) -> ExpenseDetailResponse:
        trip, caller_member = self._verify_actor_in_trip(db, actor, trip_id)
        expense = expense_repository.get_by_id(db, expense_id)
        if not expense or expense.trip_id != trip_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Expense not found in this trip.",
            )

        # Check permissions: owner of trip, payer, or creator
        is_owner = (not actor.is_guest) and (actor.user.id == trip.owner_id)
        is_payer = caller_member and (caller_member.id == expense.paid_by_member_id)
        is_creator = caller_member and (caller_member.id == expense.created_by_member_id)

        if not (is_owner or is_payer or is_creator):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to edit this expense.",
            )

        update_dict = {}
        if updates.title is not None:
            update_dict["title"] = updates.title.strip()
        if updates.category is not None:
            update_dict["category"] = updates.category
        if updates.currency is not None:
            update_dict["currency"] = updates.currency
        if updates.expense_date is not None:
            update_dict["expense_date"] = updates.expense_date
        if updates.location_name is not None:
            update_dict["location_name"] = updates.location_name.strip() if updates.location_name else None
        if updates.notes is not None:
            update_dict["notes"] = updates.notes.strip() if updates.notes else None
        if updates.receipt_url is not None:
            update_dict["receipt_url"] = updates.receipt_url.strip() if updates.receipt_url else None

        if updates.paid_by_member_id is not None:
            payer = (
                db.query(TripMember)
                .filter(
                    TripMember.id == updates.paid_by_member_id,
                    TripMember.trip_id == trip.id,
                    TripMember.status == "ACTIVE",
                )
                .first()
            )
            if not payer:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Payer is not an active member of this trip.",
                )
            update_dict["paid_by_member_id"] = updates.paid_by_member_id

        # Check if amount or splits changed
        target_amount = updates.amount if updates.amount is not None else expense.amount
        target_split_method = updates.split_method if updates.split_method is not None else expense.split_method
        update_dict["amount"] = target_amount
        update_dict["split_method"] = target_split_method

        new_split_models = None
        # Recalculate splits if splits input passed OR amount changed OR split_method changed
        if (
            updates.splits is not None
            or updates.amount is not None
            or updates.split_method is not None
        ):
            active_members = (
                db.query(TripMember)
                .filter(TripMember.trip_id == trip.id, TripMember.status == "ACTIVE")
                .all()
            )
            active_member_ids = {m.id for m in active_members}

            splits_input = updates.splits
            if splits_input is None:
                # Use existing participants from current splits
                if target_split_method == "EQUAL":
                    splits_input = [SplitItemInput(member_id=s.member_id) for s in expense.splits]
                else:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Splits must be provided when changing amount or split method for non-equal splits.",
                    )

            calc_splits = calculate_and_validate_splits(
                amount=target_amount,
                split_method=target_split_method,
                splits_input=splits_input,
                active_member_ids=active_member_ids,
            )
            new_split_models = [
                ExpenseSplit(
                    member_id=cs.member_id,
                    amount=cs.amount,
                    split_value=cs.split_value,
                )
                for cs in calc_splits
            ]

        updated = expense_repository.update(db, expense, update_dict, new_split_models)
        return self._to_detail_response(updated)

    def delete_expense(
        self,
        db: Session,
        actor: AuthActor,
        trip_id: str,
        expense_id: str,
    ) -> None:
        trip, caller_member = self._verify_actor_in_trip(db, actor, trip_id)
        expense = expense_repository.get_by_id(db, expense_id)
        if not expense or expense.trip_id != trip_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Expense not found in this trip.",
            )

        is_owner = (not actor.is_guest) and (actor.user.id == trip.owner_id)
        is_payer = caller_member and (caller_member.id == expense.paid_by_member_id)
        is_creator = caller_member and (caller_member.id == expense.created_by_member_id)

        if not (is_owner or is_payer or is_creator):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to delete this expense.",
            )

        expense_repository.delete(db, expense)


expense_service = ExpenseService()
