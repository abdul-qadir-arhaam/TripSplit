from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field


class SplitItemInput(BaseModel):
    member_id: str
    amount: Optional[Decimal] = Field(None, ge=0)
    percentage: Optional[Decimal] = Field(None, ge=0)
    shares: Optional[Decimal] = Field(None, gt=0)


class ExpenseCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=150)
    amount: Decimal = Field(..., gt=0)
    currency: str = Field("INR", max_length=10)
    category: str = Field("Miscellaneous", max_length=50)
    paid_by_member_id: str
    split_method: str = Field("EQUAL", pattern="^(EQUAL|EXACT|PERCENTAGE|SHARES)$")
    expense_date: Optional[datetime] = None
    location_name: Optional[str] = None
    notes: Optional[str] = None
    receipt_url: Optional[str] = None
    splits: List[SplitItemInput] = []


class ExpenseUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=150)
    amount: Optional[Decimal] = Field(None, gt=0)
    currency: Optional[str] = Field(None, max_length=10)
    category: Optional[str] = Field(None, max_length=50)
    paid_by_member_id: Optional[str] = None
    split_method: Optional[str] = Field(None, pattern="^(EQUAL|EXACT|PERCENTAGE|SHARES)$")
    expense_date: Optional[datetime] = None
    location_name: Optional[str] = None
    notes: Optional[str] = None
    receipt_url: Optional[str] = None
    splits: Optional[List[SplitItemInput]] = None


class ExpenseSplitResponse(BaseModel):
    id: str
    expense_id: str
    member_id: str
    amount: Decimal
    split_value: Optional[Decimal] = None
    member_display_name: str
    member_type: str

    model_config = ConfigDict(from_attributes=True)


class ExpenseResponse(BaseModel):
    id: str
    trip_id: str
    title: str
    amount: Decimal
    currency: str
    category: str
    paid_by_member_id: str
    paid_by_name: str
    split_method: str
    expense_date: datetime
    location_name: Optional[str] = None
    notes: Optional[str] = None
    receipt_url: Optional[str] = None
    created_by_member_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    split_count: int = 0

    model_config = ConfigDict(from_attributes=True)


class ExpenseDetailResponse(ExpenseResponse):
    splits: List[ExpenseSplitResponse] = []

    model_config = ConfigDict(from_attributes=True)
