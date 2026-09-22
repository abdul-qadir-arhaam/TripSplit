from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, asc
from app.models.expense import Expense
from app.models.expense_split import ExpenseSplit


class ExpenseRepository:
    def get_by_id(self, db: Session, expense_id: str) -> Optional[Expense]:
        return (
            db.query(Expense)
            .options(
                joinedload(Expense.splits).joinedload(ExpenseSplit.member),
                joinedload(Expense.paid_by),
                joinedload(Expense.created_by),
            )
            .filter(Expense.id == expense_id)
            .first()
        )

    def list_for_trip(
        self,
        db: Session,
        trip_id: str,
        category: Optional[str] = None,
        payer_id: Optional[str] = None,
        search: Optional[str] = None,
        sort_by: str = "date",
        order: str = "desc",
    ) -> List[Expense]:
        query = (
            db.query(Expense)
            .options(
                joinedload(Expense.splits).joinedload(ExpenseSplit.member),
                joinedload(Expense.paid_by),
            )
            .filter(Expense.trip_id == trip_id)
        )

        if category and category.upper() != "ALL":
            query = query.filter(Expense.category.ilike(category))

        if payer_id:
            query = query.filter(Expense.paid_by_member_id == payer_id)

        if search:
            search_term = f"%{search}%"
            query = query.filter(
                (Expense.title.ilike(search_term))
                | (Expense.notes.ilike(search_term))
                | (Expense.location_name.ilike(search_term))
            )

        # Sorting
        sort_column = Expense.expense_date
        if sort_by == "amount":
            sort_column = Expense.amount
        elif sort_by == "created_at":
            sort_column = Expense.created_at

        if order.lower() == "asc":
            query = query.order_by(asc(sort_column))
        else:
            query = query.order_by(desc(sort_column))

        return query.all()

    def create(self, db: Session, expense: Expense, splits: List[ExpenseSplit]) -> Expense:
        db.add(expense)
        db.flush()  # assign id if needed
        for s in splits:
            s.expense_id = expense.id
            db.add(s)
        db.commit()
        db.refresh(expense)
        return expense

    def update(
        self,
        db: Session,
        expense: Expense,
        updates: dict,
        new_splits: Optional[List[ExpenseSplit]] = None,
    ) -> Expense:
        for k, v in updates.items():
            if hasattr(expense, k) and v is not None:
                setattr(expense, k, v)

        expense.updated_at = datetime.now(timezone.utc)

        if new_splits is not None:
            # Delete old splits
            db.query(ExpenseSplit).filter(ExpenseSplit.expense_id == expense.id).delete()
            db.flush()
            for s in new_splits:
                s.expense_id = expense.id
                db.add(s)

        db.commit()
        db.refresh(expense)
        return expense

    def delete(self, db: Session, expense: Expense) -> None:
        db.delete(expense)
        db.commit()


expense_repository = ExpenseRepository()
