from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field


class GroupCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)


class GroupUpdate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)


class GroupMemberAdd(BaseModel):
    user_id: str


class GroupMemberResponse(BaseModel):
    id: str
    user_id: str
    name: str
    email: str
    profile_photo: Optional[str] = None
    joined_at: datetime

    model_config = ConfigDict(from_attributes=True)


class GroupResponse(BaseModel):
    id: str
    name: str
    owner_id: str
    member_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class GroupDetailResponse(BaseModel):
    id: str
    name: str
    owner_id: str
    created_at: datetime
    updated_at: datetime
    members: List[GroupMemberResponse] = []

    model_config = ConfigDict(from_attributes=True)
