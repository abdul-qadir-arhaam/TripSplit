from datetime import datetime, timezone
from typing import Optional, List, Tuple
from sqlalchemy import or_, and_
from sqlalchemy.orm import Session
from app.models.friend_request import FriendRequest
from app.models.user import User


class FriendRepository:
    def get_request_by_id(self, db: Session, request_id: str) -> Optional[FriendRequest]:
        return db.query(FriendRequest).filter(FriendRequest.id == request_id).first()

    def get_relation_between(self, db: Session, user1_id: str, user2_id: str) -> Optional[FriendRequest]:
        """Find any existing friend request record between two users in either direction."""
        return db.query(FriendRequest).filter(
            or_(
                and_(FriendRequest.sender_id == user1_id, FriendRequest.receiver_id == user2_id),
                and_(FriendRequest.sender_id == user2_id, FriendRequest.receiver_id == user1_id)
            )
        ).first()

    def create_request(self, db: Session, sender_id: str, receiver_id: str) -> FriendRequest:
        req = FriendRequest(
            sender_id=sender_id,
            receiver_id=receiver_id,
            status="PENDING"
        )
        db.add(req)
        db.commit()
        db.refresh(req)
        return req

    def update_status(self, db: Session, request: FriendRequest, status: str) -> FriendRequest:
        request.status = status
        request.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(request)
        return request

    def delete_friendship(self, db: Session, user1_id: str, user2_id: str) -> bool:
        record = self.get_relation_between(db, user1_id, user2_id)
        if record:
            db.delete(record)
            db.commit()
            return True
        return False

    def get_accepted_friends(self, db: Session, user_id: str) -> List[Tuple[User, datetime]]:
        """Return list of (User, friendship_date) for all accepted friendships of the user."""
        records = db.query(FriendRequest).filter(
            FriendRequest.status == "ACCEPTED",
            or_(FriendRequest.sender_id == user_id, FriendRequest.receiver_id == user_id)
        ).all()

        friends = []
        for r in records:
            friend_user = r.receiver if r.sender_id == user_id else r.sender
            friends.append((friend_user, r.updated_at))
        return friends

    def get_pending_incoming(self, db: Session, user_id: str) -> List[FriendRequest]:
        return db.query(FriendRequest).filter(
            FriendRequest.receiver_id == user_id,
            FriendRequest.status == "PENDING"
        ).all()

    def get_pending_outgoing(self, db: Session, user_id: str) -> List[FriendRequest]:
        return db.query(FriendRequest).filter(
            FriendRequest.sender_id == user_id,
            FriendRequest.status == "PENDING"
        ).all()

    def search_users(self, db: Session, query_str: str, exclude_user_id: str, limit: int = 15) -> List[User]:
        term = f"%{query_str.strip().lower()}%"
        return db.query(User).filter(
            User.id != exclude_user_id,
            or_(User.name.ilike(term), User.email.ilike(term))
        ).limit(limit).all()


friend_repository = FriendRepository()
