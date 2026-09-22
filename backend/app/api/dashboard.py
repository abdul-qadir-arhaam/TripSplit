from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_actor, AuthActor
from app.schemas.dashboard import TripDashboardResponse
from app.services.dashboard_service import dashboard_service

router = APIRouter(prefix="/trips/{trip_id}/dashboard", tags=["Trip Dashboard"])


@router.get("", response_model=TripDashboardResponse)
def get_trip_dashboard(
    trip_id: str,
    actor: AuthActor = Depends(get_current_actor),
    db: Session = Depends(get_db),
):
    """Retrieve comprehensive trip dashboard analytics, velocity, trends, and budget tracking."""
    return dashboard_service.get_trip_dashboard(db, actor, trip_id)
