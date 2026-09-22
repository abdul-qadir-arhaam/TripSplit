import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


class Settlement(Base):
    __tablename__ = "settlements"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    trip_id = Column(String(36), ForeignKey("trips.id", ondelete="CASCADE"), nullable=False, index=True)
    from_member_id = Column(String(36), ForeignKey("trip_members.id", ondelete="RESTRICT"), nullable=False, index=True)
    to_member_id = Column(String(36), ForeignKey("trip_members.id", ondelete="RESTRICT"), nullable=False, index=True)
    amount = Column(Numeric(12, 2), nullable=False)
    currency = Column(String(10), default="INR", nullable=False)
    status = Column(String(20), default="PENDING", nullable=False, index=True)  # PENDING, PAID, CANCELLED
    payment_date = Column(DateTime, nullable=True)
    payment_method = Column(String(50), nullable=True)  # UPI, Cash, Bank Transfer, Card, Other
    notes = Column(Text, nullable=True)
    created_by_member_id = Column(String(36), ForeignKey("trip_members.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    trip = relationship("Trip", back_populates="settlements")
    from_member = relationship("TripMember", foreign_keys=[from_member_id])
    to_member = relationship("TripMember", foreign_keys=[to_member_id])
    created_by_member = relationship("TripMember", foreign_keys=[created_by_member_id])
