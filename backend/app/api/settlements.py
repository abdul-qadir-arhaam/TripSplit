from typing import Optional
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_actor, AuthActor
from app.schemas.settlement import (
    SettlementCreate,
    SettlementUpdate,
    SettlementResponse,
    SettlementListResponse,
)
from app.services.settlement_service import settlement_service

router = APIRouter(prefix="/trips/{trip_id}/settlements", tags=["Settlements"])


@router.post("", response_model=SettlementResponse, status_code=status.HTTP_201_CREATED)
def record_settlement(
    trip_id: str,
    data: SettlementCreate,
    actor: AuthActor = Depends(get_current_actor),
    db: Session = Depends(get_db),
):
    """Record a debt settlement between two trip members."""
    return settlement_service.record_settlement(db, actor, trip_id, data)


@router.get("", response_model=SettlementListResponse)
def list_settlements(
    trip_id: str,
    status: Optional[str] = Query(None, description="Filter by status: PENDING, PAID, CANCELLED, or ALL"),
    actor: AuthActor = Depends(get_current_actor),
    db: Session = Depends(get_db),
):
    """List all recorded settlements and status summary for a trip."""
    return settlement_service.list_settlements(db, actor, trip_id, status_filter=status)


@router.get("/{settlement_id}", response_model=SettlementResponse)
def get_settlement(
    trip_id: str,
    settlement_id: str,
    actor: AuthActor = Depends(get_current_actor),
    db: Session = Depends(get_db),
):
    """Get details of a specific settlement record."""
    return settlement_service.get_settlement(db, actor, trip_id, settlement_id)


@router.patch("/{settlement_id}", response_model=SettlementResponse)
def update_settlement(
    trip_id: str,
    settlement_id: str,
    data: SettlementUpdate,
    actor: AuthActor = Depends(get_current_actor),
    db: Session = Depends(get_db),
):
    """Update a settlement (e.g. mark as PAID, CANCELLED, or update notes/method)."""
    return settlement_service.update_settlement(db, actor, trip_id, settlement_id, data)


@router.delete("/{settlement_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_settlement(
    trip_id: str,
    settlement_id: str,
    actor: AuthActor = Depends(get_current_actor),
    db: Session = Depends(get_db),
):
    """Delete a settlement record."""
    settlement_service.delete_settlement(db, actor, trip_id, settlement_id)
    return None
