from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field


class SettlementCreate(BaseModel):
    from_member_id: str
    to_member_id: str
    amount: Decimal = Field(..., gt=0)
    currency: str = Field("INR", max_length=10)
    status: str = Field("PAID", pattern="^(PENDING|PAID)$")
    payment_date: Optional[datetime] = None
    payment_method: Optional[str] = Field(None, max_length=50)
    notes: Optional[str] = None


class SettlementUpdate(BaseModel):
    status: Optional[str] = Field(None, pattern="^(PENDING|PAID|CANCELLED)$")
    payment_date: Optional[datetime] = None
    payment_method: Optional[str] = Field(None, max_length=50)
    notes: Optional[str] = None


class SettlementResponse(BaseModel):
    id: str
    trip_id: str
    from_member_id: str
    from_member_name: str
    to_member_id: str
    to_member_name: str
    amount: Decimal
    currency: str
    status: str
    payment_date: Optional[datetime] = None
    payment_method: Optional[str] = None
    notes: Optional[str] = None
    created_by_member_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SettlementsSummary(BaseModel):
    total_settled_amount: Decimal = Decimal("0.00")
    total_pending_amount: Decimal = Decimal("0.00")
    settled_count: int = 0
    pending_count: int = 0


class SettlementListResponse(BaseModel):
    settlements: List[SettlementResponse] = []
    summary: SettlementsSummary
