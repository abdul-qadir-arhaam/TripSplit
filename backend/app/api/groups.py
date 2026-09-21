from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.group import (
    GroupCreate,
    GroupUpdate,
    GroupResponse,
    GroupDetailResponse,
    GroupMemberAdd,
)
from app.services.group_service import group_service

router = APIRouter(prefix="/groups", tags=["Groups"])


@router.get("", response_model=List[GroupResponse])
def get_user_groups(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """List all groups the current user owns or is a member of."""
    return group_service.get_user_groups(db, current_user)


@router.post("", response_model=GroupResponse, status_code=status.HTTP_201_CREATED)
def create_group(
    group_in: GroupCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new travel group."""
    return group_service.create_group(db, current_user, group_in)


@router.get("/{group_id}", response_model=GroupDetailResponse)
def get_group_details(
    group_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get group details including all members."""
    return group_service.get_group_detail(db, current_user, group_id)


@router.patch("/{group_id}", response_model=GroupResponse)
def update_group(
    group_id: str,
    group_in: GroupUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Rename or update a group (owner only)."""
    return group_service.update_group(db, current_user, group_id, group_in)


@router.delete("/{group_id}")
def delete_group(
    group_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a group (owner only)."""
    group_service.delete_group(db, current_user, group_id)
    return {"message": "Group deleted successfully."}


@router.post("/{group_id}/members", response_model=GroupDetailResponse)
def add_group_member(
    group_id: str,
    member_in: GroupMemberAdd,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a registered user to the group."""
    return group_service.add_member(db, current_user, group_id, member_in.user_id)


@router.delete("/{group_id}/members/{target_user_id}", response_model=GroupDetailResponse)
def remove_group_member(
    group_id: str,
    target_user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove a user from the group."""
    return group_service.remove_member(db, current_user, group_id, target_user_id)
