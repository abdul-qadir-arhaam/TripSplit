from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdateRequest
from app.services.user_service import user_service
from app.services.friend_service import friend_service
from app.dependencies import get_current_user

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserResponse)
def get_user_me(current_user: User = Depends(get_current_user)):
    """Retrieve profile of currently authenticated user."""
    return UserResponse.model_validate(current_user)


@router.patch("/me", response_model=UserResponse)
def update_user_me(
    request: UserUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update profile attributes for currently authenticated user."""
    updated = user_service.update_profile(db, current_user, request)
    return UserResponse.model_validate(updated)


@router.get("/search", response_model=List[UserResponse])
def search_users(
    q: str = Query("", min_length=1, description="Search term for name or email"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Search registered users to connect with as friends."""
    users = friend_service.search_users(db, current_user, q)
    return [UserResponse.model_validate(u) for u in users]
