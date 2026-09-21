from datetime import datetime, date
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field, EmailStr
from app.schemas.user import UserResponse


class TripMemberResponse(BaseModel):
    id: str
    trip_id: str
    user_id: Optional[str] = None
    display_name: str
    member_type: str
    role: str
    status: str
    joined_at: datetime
    email: Optional[str] = None
    profile_photo: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class TripCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    destination: str = Field(..., min_length=2, max_length=150)
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    budget: Optional[Decimal] = Field(None, ge=0)
    currency: str = Field("INR", max_length=10)
    trip_type: str = Field("Vacation", max_length=50)
    member_user_ids: List[str] = []


class TripUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=150)
    destination: Optional[str] = Field(None, min_length=2, max_length=150)
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    budget: Optional[Decimal] = Field(None, ge=0)
    currency: Optional[str] = Field(None, max_length=10)
    trip_type: Optional[str] = Field(None, max_length=50)
    status: Optional[str] = Field(None, max_length=20)


class TripResponse(BaseModel):
    id: str
    name: str
    destination: str
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    budget: Optional[Decimal] = None
    currency: str
    trip_type: str
    owner_id: str
    status: str
    member_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TripDetailResponse(TripResponse):
    members: List[TripMemberResponse] = []

    model_config = ConfigDict(from_attributes=True)


class TripMemberAdd(BaseModel):
    user_id: str


class TripInviteInfoResponse(BaseModel):
    id: str
    name: str
    destination: str
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    trip_type: str
    owner_name: str
    member_count: int
    status: str

    model_config = ConfigDict(from_attributes=True)


class TripGuestJoin(BaseModel):
    display_name: str = Field(..., min_length=2, max_length=100)


class TripGuestAdd(BaseModel):
    display_name: str = Field(..., min_length=2, max_length=100)


class TripGuestJoinResponse(BaseModel):
    guest_token: str
    member: TripMemberResponse
    trip: TripDetailResponse


class TripGuestConvert(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)
    name: Optional[str] = Field(None, min_length=2, max_length=100)


class TripGuestConvertResponse(BaseModel):
    message: str
    access_token: str
    user: UserResponse
    member: TripMemberResponse


class TripGuestSessionResponse(BaseModel):
    member: TripMemberResponse
    trip_id: str
    is_guest: bool = True

