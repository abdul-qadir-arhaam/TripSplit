from typing import Tuple
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.auth import RegisterRequest, LoginRequest
from app.repositories.user_repository import user_repository
from app.security.password import hash_password, verify_password
from app.security.tokens import create_access_token


class AuthService:
    def register(self, db: Session, request: RegisterRequest) -> Tuple[User, str]:
        # Check if email is already registered
        existing_user = user_repository.get_by_email(db, request.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email address already exists."
            )
        
        # Hash password and persist user
        hashed = hash_password(request.password)
        user = user_repository.create(
            db=db,
            name=request.name,
            email=request.email,
            password_hash=hashed
        )
        
        # Issue access token
        access_token = create_access_token(subject=user.id)
        return user, access_token

    def login(self, db: Session, request: LoginRequest) -> Tuple[User, str]:
        user = user_repository.get_by_email(db, request.email)
        if not user or not verify_password(request.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password.",
                headers={"WWW-Authenticate": "Bearer"}
            )
        
        access_token = create_access_token(subject=user.id)
        return user, access_token


auth_service = AuthService()
