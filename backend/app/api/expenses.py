from typing import List, Optional
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_actor, AuthActor
from app.schemas.expense import (
    ExpenseCreate,
    ExpenseUpdate,
    ExpenseResponse,
    ExpenseDetailResponse,
)
from app.schemas.balance import TripBalanceSummary
from app.services.expense_service import expense_service
from app.services.balance_service import balance_service

router = APIRouter(prefix="/trips/{trip_id}", tags=["Expenses & Balances"])


@router.post("/expenses", response_model=ExpenseDetailResponse, status_code=status.HTTP_201_CREATED)
def create_expense(
    trip_id: str,
    expense_in: ExpenseCreate,
    actor: AuthActor = Depends(get_current_actor),
    db: Session = Depends(get_db),
):
    """Record a new shared expense with multi-mode split allocations."""
    return expense_service.create_expense(db, actor, trip_id, expense_in)


@router.get("/expenses", response_model=List[ExpenseResponse])
def list_expenses(
    trip_id: str,
    category: Optional[str] = Query(None, description="Filter by category"),
    payer_id: Optional[str] = Query(None, description="Filter by payer member ID"),
    search: Optional[str] = Query(None, description="Search in title, notes, or location"),
    sort_by: str = Query("date", description="Sort by 'date', 'amount', or 'created_at'"),
    order: str = Query("desc", description="Sort order: 'asc' or 'desc'"),
    actor: AuthActor = Depends(get_current_actor),
    db: Session = Depends(get_db),
):
    """List all expenses for the trip with filtering and sorting."""
    return expense_service.list_expenses(
        db=db,
        actor=actor,
        trip_id=trip_id,
        category=category,
        payer_id=payer_id,
        search=search,
        sort_by=sort_by,
        order=order,
    )


@router.get("/expenses/{expense_id}", response_model=ExpenseDetailResponse)
def get_expense(
    trip_id: str,
    expense_id: str,
    actor: AuthActor = Depends(get_current_actor),
    db: Session = Depends(get_db),
):
    """Get single expense details including full participant split breakdown."""
    return expense_service.get_expense_detail(db, actor, trip_id, expense_id)


@router.patch("/expenses/{expense_id}", response_model=ExpenseDetailResponse)
def update_expense(
    trip_id: str,
    expense_id: str,
    updates: ExpenseUpdate,
    actor: AuthActor = Depends(get_current_actor),
    db: Session = Depends(get_db),
):
    """Update expense details, amount, or split allocations (owner, payer, or creator only)."""
    return expense_service.update_expense(db, actor, trip_id, expense_id, updates)


@router.delete("/expenses/{expense_id}")
def delete_expense(
    trip_id: str,
    expense_id: str,
    actor: AuthActor = Depends(get_current_actor),
    db: Session = Depends(get_db),
):
    """Delete an expense (owner, payer, or creator only)."""
    expense_service.delete_expense(db, actor, trip_id, expense_id)
    return {"message": "Expense deleted successfully."}


@router.get("/balances", response_model=TripBalanceSummary)
def get_trip_balances(
    trip_id: str,
    actor: AuthActor = Depends(get_current_actor),
    db: Session = Depends(get_db),
):
    """
    Calculate member net balances (Total Paid - Total Share) and generate
    minimized debt settlement suggestions using graph minimization.
    """
    return balance_service.calculate_trip_balances(db, actor, trip_id)
