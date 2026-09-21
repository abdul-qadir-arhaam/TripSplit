from typing import List, Dict, Any
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.friend import FriendRequestCreate, FriendRequestResponse, FriendUserResponse
from app.services.friend_service import friend_service

router = APIRouter(prefix="/friends", tags=["Friends"])


@router.get("", response_model=List[FriendUserResponse])
def get_friends(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Retrieve all accepted friends of the current user."""
    return friend_service.get_friends(db, current_user)


@router.get("/requests")
def get_friend_requests(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Retrieve all pending incoming and outgoing friend requests."""
    return friend_service.get_pending(db, current_user)


@router.post("/requests", response_model=FriendRequestResponse, status_code=status.HTTP_201_CREATED)
def send_friend_request(
    request_in: FriendRequestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send a new friend request to another user."""
    return friend_service.send_request(db, current_user, request_in.receiver_id)


@router.post("/requests/{request_id}/accept", response_model=FriendRequestResponse)
def accept_friend_request(
    request_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Accept an incoming friend request."""
    return friend_service.accept_request(db, current_user, request_id)


@router.post("/requests/{request_id}/decline", response_model=FriendRequestResponse)
def decline_friend_request(
    request_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Decline an incoming friend request."""
    return friend_service.decline_request(db, current_user, request_id)


@router.delete("/{friend_user_id}")
def remove_friend(
    friend_user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove a user from friends list."""
    friend_service.remove_friend(db, current_user, friend_user_id)
    return {"message": "Friend removed successfully."}
