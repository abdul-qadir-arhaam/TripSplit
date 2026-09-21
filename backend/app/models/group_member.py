import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


class GroupMember(Base):
    __tablename__ = "group_members"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    group_id = Column(String(36), ForeignKey("groups.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    __table_args__ = (
        UniqueConstraint("group_id", "user_id", name="uq_group_member"),
    )

    group = relationship("Group", back_populates="members")
    user = relationship("User", foreign_keys=[user_id])
