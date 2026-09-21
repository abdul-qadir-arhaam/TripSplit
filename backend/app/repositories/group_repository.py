from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.group import Group
from app.models.group_member import GroupMember


class GroupRepository:
    def get_by_id(self, db: Session, group_id: str) -> Optional[Group]:
        return db.query(Group).filter(Group.id == group_id).first()

    def get_groups_for_user(self, db: Session, user_id: str) -> List[Group]:
        """Return groups where the user is either the owner or a member."""
        # Find groups owned by user
        owned = db.query(Group).filter(Group.owner_id == user_id).all()
        # Find groups where user is a member
        member_groups = (
            db.query(Group)
            .join(GroupMember, Group.id == GroupMember.group_id)
            .filter(GroupMember.user_id == user_id)
            .all()
        )
        # Deduplicate preserving order
        seen_ids = set()
        result = []
        for g in owned + member_groups:
            if g.id not in seen_ids:
                seen_ids.add(g.id)
                result.append(g)
        return result

    def create(self, db: Session, name: str, owner_id: str) -> Group:
        group = Group(name=name.strip(), owner_id=owner_id)
        db.add(group)
        db.commit()
        db.refresh(group)
        # Automatically add the owner as a group member
        self.add_member(db, group.id, owner_id)
        return group

    def update(self, db: Session, group: Group, name: str) -> Group:
        group.name = name.strip()
        group.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(group)
        return group

    def delete(self, db: Session, group: Group) -> None:
        db.delete(group)
        db.commit()

    def add_member(self, db: Session, group_id: str, user_id: str) -> GroupMember:
        existing = self.get_member(db, group_id, user_id)
        if existing:
            return existing
        member = GroupMember(group_id=group_id, user_id=user_id)
        db.add(member)
        db.commit()
        db.refresh(member)
        return member

    def remove_member(self, db: Session, group_id: str, user_id: str) -> bool:
        member = self.get_member(db, group_id, user_id)
        if member:
            db.delete(member)
            db.commit()
            return True
        return False

    def get_member(self, db: Session, group_id: str, user_id: str) -> Optional[GroupMember]:
        return (
            db.query(GroupMember)
            .filter(GroupMember.group_id == group_id, GroupMember.user_id == user_id)
            .first()
        )


group_repository = GroupRepository()
