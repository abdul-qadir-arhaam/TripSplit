import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


class TripMember(Base):
    __tablename__ = "trip_members"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    trip_id = Column(String(36), ForeignKey("trips.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    display_name = Column(String(100), nullable=False)
    member_type = Column(String(20), default="REGISTERED", nullable=False)  # REGISTERED, GUEST
    guest_token_hash = Column(String(255), nullable=True)
    status = Column(String(20), default="ACTIVE", nullable=False)  # ACTIVE, INACTIVE
    role = Column(String(20), default="MEMBER", nullable=False)  # OWNER, MEMBER
    joined_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    trip = relationship("Trip", back_populates="members")
    user = relationship("User", foreign_keys=[user_id])
