from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.schemas.user import UserResponse


class FriendRequestCreate(BaseModel):
    receiver_id: str


class FriendRequestResponse(BaseModel):
    id: str
    sender_id: str
    receiver_id: str
    status: str
    created_at: datetime
    updated_at: datetime
    sender: Optional[UserResponse] = None
    receiver: Optional[UserResponse] = None

    model_config = ConfigDict(from_attributes=True)


class FriendUserResponse(BaseModel):
    id: str
    name: str
    email: str
    profile_photo: Optional[str] = None
    friendship_date: datetime

    model_config = ConfigDict(from_attributes=True)
