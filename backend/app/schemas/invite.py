from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class InviteCreate(BaseModel):
    expires_in_days: Optional[int] = Field(None, ge=1, le=365)
    max_uses: Optional[int] = Field(None, ge=1)
    require_approval: bool = False


class InviteResponse(BaseModel):
    id: str
    trip_id: str
    code: str
    token: Optional[str] = None  # Populated when newly generated or regenerated
    expires_at: Optional[datetime] = None
    max_uses: Optional[int] = None
    use_count: int
    is_active: bool
    require_approval: bool
    created_at: datetime
    updated_at: datetime
    created_by_id: str
    is_expired: bool = False

    model_config = ConfigDict(from_attributes=True)


class InvitePreviewResponse(BaseModel):
    trip_id: str
    name: str
    destination: str
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    trip_type: str
    owner_name: str
    member_count: int
    is_valid: bool
    is_expired: bool
    is_active: bool
    expires_at: Optional[datetime] = None
    max_uses: Optional[int] = None
    use_count: int

    model_config = ConfigDict(from_attributes=True)


class InviteGuestJoinRequest(BaseModel):
    display_name: str = Field(..., min_length=2, max_length=100)
