from typing import List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.group import Group
from app.schemas.group import (
    GroupCreate,
    GroupUpdate,
    GroupResponse,
    GroupDetailResponse,
    GroupMemberResponse,
)
from app.repositories.group_repository import group_repository
from app.repositories.user_repository import user_repository


class GroupService:
    def create_group(self, db: Session, user: User, data: GroupCreate) -> GroupResponse:
        group = group_repository.create(db, data.name, user.id)
        return GroupResponse(
            id=group.id,
            name=group.name,
            owner_id=group.owner_id,
            member_count=len(group.members),
            created_at=group.created_at,
            updated_at=group.updated_at,
        )

    def get_user_groups(self, db: Session, user: User) -> List[GroupResponse]:
        groups = group_repository.get_groups_for_user(db, user.id)
        return [
            GroupResponse(
                id=g.id,
                name=g.name,
                owner_id=g.owner_id,
                member_count=len(g.members),
                created_at=g.created_at,
                updated_at=g.updated_at,
            )
            for g in groups
        ]

    def get_group_detail(self, db: Session, user: User, group_id: str) -> GroupDetailResponse:
        group = group_repository.get_by_id(db, group_id)
        if not group:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Group not found."
            )
        # Verify access: user must be owner or member
        is_member = any(m.user_id == user.id for m in group.members)
        if group.owner_id != user.id and not is_member:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this group."
            )

        members_dto = []
        for m in group.members:
            u = m.user
            if u:
                members_dto.append(
                    GroupMemberResponse(
                        id=m.id,
                        user_id=u.id,
                        name=u.name,
                        email=u.email,
                        profile_photo=u.profile_photo,
                        joined_at=m.created_at,
                    )
                )

        return GroupDetailResponse(
            id=group.id,
            name=group.name,
            owner_id=group.owner_id,
            created_at=group.created_at,
            updated_at=group.updated_at,
            members=members_dto,
        )

    def update_group(self, db: Session, user: User, group_id: str, data: GroupUpdate) -> GroupResponse:
        group = group_repository.get_by_id(db, group_id)
        if not group:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Group not found."
            )
        if group.owner_id != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the group owner can update group details."
            )
        updated = group_repository.update(db, group, data.name)
        return GroupResponse(
            id=updated.id,
            name=updated.name,
            owner_id=updated.owner_id,
            member_count=len(updated.members),
            created_at=updated.created_at,
            updated_at=updated.updated_at,
        )

    def delete_group(self, db: Session, user: User, group_id: str) -> None:
        group = group_repository.get_by_id(db, group_id)
        if not group:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Group not found."
            )
        if group.owner_id != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the group owner can delete this group."
            )
        group_repository.delete(db, group)

    def add_member(self, db: Session, user: User, group_id: str, target_user_id: str) -> GroupDetailResponse:
        group = group_repository.get_by_id(db, group_id)
        if not group:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Group not found."
            )
        # Check permissions: owner or member can add
        is_member = any(m.user_id == user.id for m in group.members)
        if group.owner_id != user.id and not is_member:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to add members to this group."
            )

        target_user = user_repository.get_by_id(db, target_user_id)
        if not target_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Target user not found."
            )

        group_repository.add_member(db, group_id, target_user_id)
        return self.get_group_detail(db, user, group_id)

    def remove_member(self, db: Session, user: User, group_id: str, target_user_id: str) -> GroupDetailResponse:
        group = group_repository.get_by_id(db, group_id)
        if not group:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Group not found."
            )
        # Owner can remove anyone, member can remove themselves (leave group)
        if group.owner_id != user.id and user.id != target_user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only remove yourself from this group."
            )
        if target_user_id == group.owner_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The group owner cannot be removed. Delete the group instead."
            )

        group_repository.remove_member(db, group_id, target_user_id)
        return self.get_group_detail(db, user, group_id)


group_service = GroupService()
