from typing import Optional
from sqlalchemy.orm import Session
from app.models.user import User


class UserRepository:
    def get_by_id(self, db: Session, user_id: str) -> Optional[User]:
        return db.query(User).filter(User.id == user_id).first()

    def get_by_email(self, db: Session, email: str) -> Optional[User]:
        return db.query(User).filter(User.email == email.lower().strip()).first()

    def create(
        self,
        db: Session,
        name: str,
        email: str,
        password_hash: str,
        profile_photo: Optional[str] = None
    ) -> User:
        user = User(
            name=name.strip(),
            email=email.lower().strip(),
            password_hash=password_hash,
            profile_photo=profile_photo
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    def update(
        self,
        db: Session,
        user: User,
        name: Optional[str] = None,
        profile_photo: Optional[str] = None
    ) -> User:
        if name is not None:
            user.name = name.strip()
        if profile_photo is not None:
            user.profile_photo = profile_photo
        db.commit()
        db.refresh(user)
        return user


user_repository = UserRepository()
