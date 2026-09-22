from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, func
from app.models.settlement import Settlement


class SettlementRepository:
    def get_by_id(self, db: Session, settlement_id: str) -> Optional[Settlement]:
        return (
            db.query(Settlement)
            .options(
                joinedload(Settlement.from_member),
                joinedload(Settlement.to_member),
                joinedload(Settlement.created_by_member),
            )
            .filter(Settlement.id == settlement_id)
            .first()
        )

    def list_for_trip(
        self,
        db: Session,
        trip_id: str,
        status: Optional[str] = None,
    ) -> List[Settlement]:
        query = (
            db.query(Settlement)
            .options(
                joinedload(Settlement.from_member),
                joinedload(Settlement.to_member),
                joinedload(Settlement.created_by_member),
            )
            .filter(Settlement.trip_id == trip_id)
        )

        if status and status.upper() != "ALL":
            query = query.filter(Settlement.status == status.upper())

        return query.order_by(desc(Settlement.created_at)).all()

    def get_summary_for_trip(self, db: Session, trip_id: str) -> Dict[str, Any]:
        rows = (
            db.query(
                Settlement.status,
                func.count(Settlement.id).label("count"),
                func.sum(Settlement.amount).label("total_amount"),
            )
            .filter(Settlement.trip_id == trip_id)
            .group_by(Settlement.status)
            .all()
        )

        total_settled = Decimal("0.00")
        total_pending = Decimal("0.00")
        settled_count = 0
        pending_count = 0

        for status, count, total in rows:
            amount = Decimal(str(total)) if total is not None else Decimal("0.00")
            if status == "PAID":
                total_settled = amount
                settled_count = count
            elif status == "PENDING":
                total_pending = amount
                pending_count = count

        return {
            "total_settled_amount": total_settled,
            "total_pending_amount": total_pending,
            "settled_count": settled_count,
            "pending_count": pending_count,
        }

    def create(self, db: Session, settlement: Settlement) -> Settlement:
        db.add(settlement)
        db.commit()
        db.refresh(settlement)
        return settlement

    def update(self, db: Session, settlement: Settlement, updates: dict) -> Settlement:
        for k, v in updates.items():
            if hasattr(settlement, k) and v is not None:
                setattr(settlement, k, v)

        settlement.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(settlement)
        return settlement

    def delete(self, db: Session, settlement: Settlement) -> None:
        db.delete(settlement)
        db.commit()


settlement_repository = SettlementRepository()
