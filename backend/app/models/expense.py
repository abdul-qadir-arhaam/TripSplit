import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    trip_id = Column(String(36), ForeignKey("trips.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(150), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    currency = Column(String(10), default="INR", nullable=False)
    category = Column(String(50), default="Miscellaneous", nullable=False, index=True)
    paid_by_member_id = Column(String(36), ForeignKey("trip_members.id", ondelete="RESTRICT"), nullable=False, index=True)
    split_method = Column(String(20), default="EQUAL", nullable=False)  # EQUAL, EXACT, PERCENTAGE, SHARES
    expense_date = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    location_name = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
    receipt_url = Column(String(500), nullable=True)
    created_by_member_id = Column(String(36), ForeignKey("trip_members.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    trip = relationship("Trip", back_populates="expenses")
    paid_by = relationship("TripMember", foreign_keys=[paid_by_member_id])
    created_by = relationship("TripMember", foreign_keys=[created_by_member_id])
    splits = relationship("ExpenseSplit", back_populates="expense", cascade="all, delete-orphan")
