from datetime import datetime, timezone, date
from decimal import Decimal
from typing import Dict, List, Any
from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload
from app.models.expense import Expense
from app.models.trip import Trip
from app.models.trip_member import TripMember
from app.dependencies import AuthActor
from app.repositories.trip_repository import trip_repository
from app.repositories.settlement_repository import settlement_repository
from app.services.balance_service import balance_service
from app.schemas.settlement import SettlementsSummary
from app.schemas.dashboard import (
    FinancialMetrics,
    CategorySpend,
    DailySpend,
    MemberSpendSummary,
    TopExpenseItem,
    TripDashboardResponse,
)


class DashboardService:
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

    def get_trip_dashboard(
        self,
        db: Session,
        actor: AuthActor,
        trip_id: str,
    ) -> TripDashboardResponse:
        trip = self._verify_actor_in_trip(db, actor, trip_id)

        # 1. Fetch active members
        active_members = (
            db.query(TripMember)
            .filter(TripMember.trip_id == trip.id, TripMember.status == "ACTIVE")
            .all()
        )
        member_count = len(active_members)

        # 2. Fetch all expenses with payer loaded
        expenses = (
            db.query(Expense)
            .options(joinedload(Expense.paid_by))
            .filter(Expense.trip_id == trip.id)
            .all()
        )

        total_spent = sum((e.amount for e in expenses), Decimal("0.00")).quantize(Decimal("0.01"))
        total_budget = trip.budget

        # 3. Budget & Timeline calculations
        remaining_budget = None
        percentage_used = None
        budget_status = "NO_BUDGET"

        if total_budget and total_budget > Decimal("0.00"):
            remaining_budget = (total_budget - total_spent).quantize(Decimal("0.01"))
            percentage_used = ((total_spent / total_budget) * Decimal("100")).quantize(Decimal("0.01"))
            if percentage_used >= Decimal("100.00"):
                budget_status = "OVER_BUDGET"
            elif percentage_used >= Decimal("75.00"):
                budget_status = "CAUTION"
            else:
                budget_status = "ON_TRACK"

        # Days metrics
        today = datetime.now(timezone.utc).date()
        total_days = None
        days_elapsed = None
        days_remaining = None

        if trip.start_date and trip.end_date:
            total_days = max(1, (trip.end_date - trip.start_date).days + 1)
            if today < trip.start_date:
                days_elapsed = 0
                days_remaining = total_days
            elif today > trip.end_date:
                days_elapsed = total_days
                days_remaining = 0
            else:
                days_elapsed = max(1, (today - trip.start_date).days + 1)
                days_remaining = max(0, (trip.end_date - today).days)

        # Averages
        average_per_person = (
            (total_spent / Decimal(member_count)).quantize(Decimal("0.01"))
            if member_count > 0
            else Decimal("0.00")
        )

        if days_elapsed and days_elapsed > 0:
            average_daily_spend = (total_spent / Decimal(days_elapsed)).quantize(Decimal("0.01"))
        else:
            distinct_expense_days = len(set(e.expense_date.date() for e in expenses)) if expenses else 1
            average_daily_spend = (total_spent / Decimal(max(1, distinct_expense_days))).quantize(Decimal("0.01"))

        remaining_daily_budget = None
        if remaining_budget is not None and days_remaining and days_remaining > 0:
            remaining_daily_budget = max(
                Decimal("0.00"),
                (remaining_budget / Decimal(days_remaining)).quantize(Decimal("0.01")),
            )

        financials = FinancialMetrics(
            total_budget=total_budget,
            total_spent=total_spent,
            remaining_budget=remaining_budget,
            percentage_used=percentage_used,
            budget_status=budget_status,
            average_per_person=average_per_person,
            average_daily_spend=average_daily_spend,
            remaining_daily_budget=remaining_daily_budget,
            total_days=total_days,
            days_elapsed=days_elapsed,
            days_remaining=days_remaining,
        )

        # 4. Category breakdown
        cat_map: Dict[str, Dict[str, Any]] = {}
        for e in expenses:
            cat = e.category or "Miscellaneous"
            if cat not in cat_map:
                cat_map[cat] = {"amount": Decimal("0.00"), "count": 0}
            cat_map[cat]["amount"] += e.amount
            cat_map[cat]["count"] += 1

        category_breakdown: List[CategorySpend] = []
        for cat, val in cat_map.items():
            pct = (
                ((val["amount"] / total_spent) * Decimal("100")).quantize(Decimal("0.01"))
                if total_spent > Decimal("0.00")
                else Decimal("0.00")
            )
            category_breakdown.append(
                CategorySpend(
                    category=cat,
                    amount=val["amount"].quantize(Decimal("0.01")),
                    percentage=pct,
                    count=val["count"],
                )
            )
        category_breakdown.sort(key=lambda x: x.amount, reverse=True)

        # 5. Daily trends
        daily_map: Dict[str, Dict[str, Any]] = {}
        for e in expenses:
            d_str = e.expense_date.strftime("%Y-%m-%d")
            if d_str not in daily_map:
                daily_map[d_str] = {"amount": Decimal("0.00"), "count": 0}
            daily_map[d_str]["amount"] += e.amount
            daily_map[d_str]["count"] += 1

        daily_trends: List[DailySpend] = []
        for d_str in sorted(daily_map.keys()):
            daily_trends.append(
                DailySpend(
                    date=d_str,
                    amount=daily_map[d_str]["amount"].quantize(Decimal("0.01")),
                    count=daily_map[d_str]["count"],
                )
            )

        # 6. Member contributions from balance calculation
        balances_summary = balance_service.calculate_trip_balances(db, actor, trip.id)
        member_contributions: List[MemberSpendSummary] = []
        for mb in balances_summary.balances:
            pct_paid = (
                ((mb.total_paid / total_spent) * Decimal("100")).quantize(Decimal("0.01"))
                if total_spent > Decimal("0.00")
                else Decimal("0.00")
            )
            member_contributions.append(
                MemberSpendSummary(
                    member_id=mb.member_id,
                    display_name=mb.display_name,
                    member_type=mb.member_type,
                    total_paid=mb.total_paid,
                    total_share=mb.total_share,
                    net_balance=mb.net_balance,
                    percentage_of_total_paid=pct_paid,
                )
            )
        member_contributions.sort(key=lambda x: x.total_paid, reverse=True)

        # 7. Largest expenses (top 5)
        sorted_by_amt = sorted(expenses, key=lambda x: x.amount, reverse=True)[:5]
        largest_expenses: List[TopExpenseItem] = [
            TopExpenseItem(
                id=e.id,
                title=e.title,
                amount=e.amount,
                currency=e.currency or "INR",
                category=e.category or "Miscellaneous",
                paid_by_name=e.paid_by.display_name if e.paid_by else "Unknown",
                expense_date=e.expense_date,
            )
            for e in sorted_by_amt
        ]

        # 8. Recent expenses (top 5)
        sorted_by_date = sorted(expenses, key=lambda x: x.expense_date, reverse=True)[:5]
        recent_expenses: List[TopExpenseItem] = [
            TopExpenseItem(
                id=e.id,
                title=e.title,
                amount=e.amount,
                currency=e.currency or "INR",
                category=e.category or "Miscellaneous",
                paid_by_name=e.paid_by.display_name if e.paid_by else "Unknown",
                expense_date=e.expense_date,
            )
            for e in sorted_by_date
        ]

        # 9. Settlements summary
        settlement_summary_data = settlement_repository.get_summary_for_trip(db, trip.id)
        settlements_summary = SettlementsSummary(**settlement_summary_data)

        return TripDashboardResponse(
            trip_id=trip.id,
            trip_name=trip.name,
            destination=trip.destination,
            currency=trip.currency or "INR",
            start_date=trip.start_date,
            end_date=trip.end_date,
            member_count=member_count,
            financials=financials,
            category_breakdown=category_breakdown,
            daily_trends=daily_trends,
            member_contributions=member_contributions,
            largest_expenses=largest_expenses,
            recent_expenses=recent_expenses,
            settlements_summary=settlements_summary,
        )


dashboard_service = DashboardService()
