from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user import UserUpdateRequest
from app.repositories.user_repository import user_repository


class UserService:
    def get_by_id(self, db: Session, user_id: str) -> User:
        user = user_repository.get_by_id(db, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found."
            )
        return user

    def update_profile(self, db: Session, user: User, request: UserUpdateRequest) -> User:
        return user_repository.update(
            db=db,
            user=user,
            name=request.name,
            profile_photo=request.profile_photo
        )


user_service = UserService()
