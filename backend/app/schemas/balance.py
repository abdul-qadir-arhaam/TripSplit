from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, ConfigDict


class MemberBalance(BaseModel):
    member_id: str
    display_name: str
    member_type: str
    user_id: Optional[str] = None
    total_paid: Decimal
    total_share: Decimal
    settlement_paid: Decimal = Decimal("0.00")
    settlement_received: Decimal = Decimal("0.00")
    net_balance: Decimal
    status: str  # OWES, RECEIVES, SETTLED

    model_config = ConfigDict(from_attributes=True)


class SettlementSuggestion(BaseModel):
    from_member_id: str
    from_member_name: str
    to_member_id: str
    to_member_name: str
    amount: Decimal

    model_config = ConfigDict(from_attributes=True)


class TripBalanceSummary(BaseModel):
    trip_id: str
    currency: str
    total_spent: Decimal
    budget: Optional[Decimal] = None
    remaining_budget: Optional[Decimal] = None
    percentage_used: Optional[Decimal] = None
    is_balanced: bool
    balances: List[MemberBalance] = []
    settlement_suggestions: List[SettlementSuggestion] = []

    model_config = ConfigDict(from_attributes=True)
