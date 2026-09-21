import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


class FriendRequest(Base):
    __tablename__ = "friend_requests"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    sender_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    receiver_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(20), default="PENDING", nullable=False, index=True)  # PENDING, ACCEPTED, DECLINED
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    sender = relationship("User", foreign_keys=[sender_id], backref="sent_friend_requests")
    receiver = relationship("User", foreign_keys=[receiver_id], backref="received_friend_requests")
