import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


class ExpenseSplit(Base):
    __tablename__ = "expense_splits"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    expense_id = Column(String(36), ForeignKey("expenses.id", ondelete="CASCADE"), nullable=False, index=True)
    member_id = Column(String(36), ForeignKey("trip_members.id", ondelete="CASCADE"), nullable=False, index=True)
    amount = Column(Numeric(12, 2), nullable=False)
    split_value = Column(Numeric(12, 2), nullable=True)  # Share ratio, percentage, or explicit input
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    expense = relationship("Expense", back_populates="splits")
    member = relationship("TripMember", foreign_keys=[member_id])
