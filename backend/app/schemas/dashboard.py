from datetime import datetime, date
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from app.schemas.settlement import SettlementsSummary


class FinancialMetrics(BaseModel):
    total_budget: Optional[Decimal] = None
    total_spent: Decimal = Decimal("0.00")
    remaining_budget: Optional[Decimal] = None
    percentage_used: Optional[Decimal] = None
    budget_status: str  # ON_TRACK, CAUTION, OVER_BUDGET, NO_BUDGET
    average_per_person: Decimal = Decimal("0.00")
    average_daily_spend: Decimal = Decimal("0.00")
    remaining_daily_budget: Optional[Decimal] = None
    total_days: Optional[int] = None
    days_elapsed: Optional[int] = None
    days_remaining: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


class CategorySpend(BaseModel):
    category: str
    amount: Decimal
    percentage: Decimal
    count: int

    model_config = ConfigDict(from_attributes=True)


class DailySpend(BaseModel):
    date: str  # YYYY-MM-DD
    amount: Decimal
    count: int

    model_config = ConfigDict(from_attributes=True)


class MemberSpendSummary(BaseModel):
    member_id: str
    display_name: str
    member_type: str
    total_paid: Decimal
    total_share: Decimal
    net_balance: Decimal
    percentage_of_total_paid: Decimal

    model_config = ConfigDict(from_attributes=True)


class TopExpenseItem(BaseModel):
    id: str
    title: str
    amount: Decimal
    currency: str
    category: str
    paid_by_name: str
    expense_date: datetime

    model_config = ConfigDict(from_attributes=True)


class TripDashboardResponse(BaseModel):
    trip_id: str
    trip_name: str
    destination: str
    currency: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    member_count: int
    financials: FinancialMetrics
    category_breakdown: List[CategorySpend] = []
    daily_trends: List[DailySpend] = []
    member_contributions: List[MemberSpendSummary] = []
    largest_expenses: List[TopExpenseItem] = []
    recent_expenses: List[TopExpenseItem] = []
    settlements_summary: SettlementsSummary

    model_config = ConfigDict(from_attributes=True)
