import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, Date, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


class Trip(Base):
    __tablename__ = "trips"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    name = Column(String(150), nullable=False)
    destination = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    budget = Column(Numeric(12, 2), nullable=True)
    currency = Column(String(10), default="INR", nullable=False)
    trip_type = Column(String(50), default="Vacation", nullable=False)  # Vacation, Road Trip, College Outing, etc.
    owner_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(20), default="PLANNING", nullable=False, index=True)  # PLANNING, ACTIVE, COMPLETED, ARCHIVED
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    owner = relationship("User", foreign_keys=[owner_id])
    members = relationship("TripMember", back_populates="trip", cascade="all, delete-orphan")
