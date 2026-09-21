from fastapi import APIRouter
from app.api.health import router as health_router
from app.api.auth import router as auth_router
from app.api.users import router as users_router
from app.api.friends import router as friends_router
from app.api.groups import router as groups_router
from app.api.trips import router as trips_router
from app.api.invites import router as invites_router

api_router = APIRouter(prefix="/api")
api_router.include_router(health_router)
api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(friends_router)
api_router.include_router(groups_router)
api_router.include_router(trips_router)
api_router.include_router(invites_router)
