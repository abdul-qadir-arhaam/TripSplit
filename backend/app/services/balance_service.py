from decimal import Decimal
from typing import List, Dict, Any
from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload
from app.models.expense import Expense
from app.models.expense_split import ExpenseSplit
from app.models.settlement import Settlement
from app.models.trip import Trip
from app.models.trip_member import TripMember
from app.dependencies import AuthActor
from app.repositories.trip_repository import trip_repository
from app.schemas.balance import (
    MemberBalance,
    SettlementSuggestion,
    TripBalanceSummary,
)


class BalanceService:
    def _verify_actor_in_trip(self, db: Session, actor: AuthActor, trip_id: str) -> Trip:
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
            return trip

        user = actor.user
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required.",
            )

        is_member = any(m.user_id == user.id and m.status == "ACTIVE" for m in trip.members)
        if trip.owner_id != user.id and not is_member:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not a member of this trip.",
            )

        return trip

    def calculate_trip_balances(
        self,
        db: Session,
        actor: AuthActor,
        trip_id: str,
    ) -> TripBalanceSummary:
        trip = self._verify_actor_in_trip(db, actor, trip_id)

        # 1. Fetch active members
        active_members = (
            db.query(TripMember)
            .filter(TripMember.trip_id == trip.id, TripMember.status == "ACTIVE")
            .all()
        )

        # 2. Fetch all expenses with splits
        expenses = (
            db.query(Expense)
            .options(joinedload(Expense.splits))
            .filter(Expense.trip_id == trip.id)
            .all()
        )

        # 3. Calculate total trip spending
        total_spent = sum((e.amount for e in expenses), Decimal("0.00")).quantize(Decimal("0.01"))

        # Pre-index splits and payments by member
        paid_by_member: Dict[str, Decimal] = {m.id: Decimal("0.00") for m in active_members}
        share_by_member: Dict[str, Decimal] = {m.id: Decimal("0.00") for m in active_members}

        for e in expenses:
            if e.paid_by_member_id in paid_by_member:
                paid_by_member[e.paid_by_member_id] += e.amount
            else:
                paid_by_member[e.paid_by_member_id] = e.amount

            for s in e.splits:
                if s.member_id in share_by_member:
                    share_by_member[s.member_id] += s.amount
                else:
                    share_by_member[s.member_id] = s.amount

        # 3b. Fetch paid settlements
        paid_settlements = (
            db.query(Settlement)
            .filter(Settlement.trip_id == trip.id, Settlement.status == "PAID")
            .all()
        )

        settlement_paid_by_member: Dict[str, Decimal] = {m.id: Decimal("0.00") for m in active_members}
        settlement_received_by_member: Dict[str, Decimal] = {m.id: Decimal("0.00") for m in active_members}

        for s in paid_settlements:
            if s.from_member_id in settlement_paid_by_member:
                settlement_paid_by_member[s.from_member_id] += s.amount
            if s.to_member_id in settlement_received_by_member:
                settlement_received_by_member[s.to_member_id] += s.amount

        # 4. Compute MemberBalance records
        balances: List[MemberBalance] = []
        creditors: List[Dict[str, Any]] = []
        debtors: List[Dict[str, Any]] = []
        sum_net = Decimal("0.00")

        for m in active_members:
            paid = paid_by_member.get(m.id, Decimal("0.00")).quantize(Decimal("0.01"))
            share = share_by_member.get(m.id, Decimal("0.00")).quantize(Decimal("0.01"))
            s_paid = settlement_paid_by_member.get(m.id, Decimal("0.00")).quantize(Decimal("0.01"))
            s_received = settlement_received_by_member.get(m.id, Decimal("0.00")).quantize(Decimal("0.01"))
            net = (paid - share + s_paid - s_received).quantize(Decimal("0.01"))
            sum_net += net

            if net > Decimal("0.00"):
                status_str = "RECEIVES"
                creditors.append({
                    "id": m.id,
                    "name": m.display_name,
                    "credit": net,
                })
            elif net < Decimal("0.00"):
                status_str = "OWES"
                debtors.append({
                    "id": m.id,
                    "name": m.display_name,
                    "debt": abs(net),
                })
            else:
                status_str = "SETTLED"

            balances.append(
                MemberBalance(
                    member_id=m.id,
                    display_name=m.display_name,
                    member_type=m.member_type,
                    user_id=m.user_id,
                    total_paid=paid,
                    total_share=share,
                    settlement_paid=s_paid,
                    settlement_received=s_received,
                    net_balance=net,
                    status=status_str,
                )
            )

        is_balanced = (sum_net == Decimal("0.00"))

        # 5. Greedy Debt Minimization (Settlement Suggestions)
        creditors.sort(key=lambda x: x["credit"], reverse=True)
        debtors.sort(key=lambda x: x["debt"], reverse=True)

        suggestions: List[SettlementSuggestion] = []
        c_idx = 0
        d_idx = 0

        while c_idx < len(creditors) and d_idx < len(debtors):
            creditor = creditors[c_idx]
            debtor = debtors[d_idx]

            transfer_amount = min(debtor["debt"], creditor["credit"]).quantize(Decimal("0.01"))
            if transfer_amount > Decimal("0.00"):
                suggestions.append(
                    SettlementSuggestion(
                        from_member_id=debtor["id"],
                        from_member_name=debtor["name"],
                        to_member_id=creditor["id"],
                        to_member_name=creditor["name"],
                        amount=transfer_amount,
                    )
                )
                debtor["debt"] -= transfer_amount
                creditor["credit"] -= transfer_amount

            if debtor["debt"] == Decimal("0.00"):
                d_idx += 1
            if creditor["credit"] == Decimal("0.00"):
                c_idx += 1

        # 6. Budget metrics
        budget = trip.budget
        remaining_budget = (budget - total_spent).quantize(Decimal("0.01")) if budget is not None else None
        percentage_used = None
        if budget and budget > Decimal("0.00"):
            percentage_used = ((total_spent / budget) * Decimal("100")).quantize(Decimal("0.01"))

        return TripBalanceSummary(
            trip_id=trip.id,
            currency=trip.currency or "INR",
            total_spent=total_spent,
            budget=budget,
            remaining_budget=remaining_budget,
            percentage_used=percentage_used,
            is_balanced=is_balanced,
            balances=balances,
            settlement_suggestions=suggestions,
        )


balance_service = BalanceService()
