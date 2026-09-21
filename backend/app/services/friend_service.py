from typing import List, Dict, Any
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.friend_request import FriendRequest
from app.schemas.friend import FriendUserResponse
from app.repositories.friend_repository import friend_repository
from app.repositories.user_repository import user_repository


class FriendService:
    def send_request(self, db: Session, sender: User, receiver_id: str) -> FriendRequest:
        if sender.id == receiver_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You cannot send a friend request to yourself."
            )

        receiver = user_repository.get_by_id(db, receiver_id)
        if not receiver:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Target user not found."
            )

        existing = friend_repository.get_relation_between(db, sender.id, receiver_id)
        if existing:
            if existing.status == "ACCEPTED":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="You are already friends with this user."
                )
            if existing.status == "PENDING":
                if existing.sender_id == sender.id:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Friend request already sent."
                    )
                else:
                    # Other person already sent a request, auto-accept it!
                    return friend_repository.update_status(db, existing, "ACCEPTED")
            # If declined previously, re-open it
            if existing.status == "DECLINED":
                existing.sender_id = sender.id
                existing.receiver_id = receiver_id
                return friend_repository.update_status(db, existing, "PENDING")

        return friend_repository.create_request(db, sender.id, receiver_id)

    def accept_request(self, db: Session, user: User, request_id: str) -> FriendRequest:
        req = friend_repository.get_request_by_id(db, request_id)
        if not req:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Friend request not found."
            )
        if req.receiver_id != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only accept requests addressed to you."
            )
        return friend_repository.update_status(db, req, "ACCEPTED")

    def decline_request(self, db: Session, user: User, request_id: str) -> FriendRequest:
        req = friend_repository.get_request_by_id(db, request_id)
        if not req:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Friend request not found."
            )
        if req.receiver_id != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only decline requests addressed to you."
            )
        return friend_repository.update_status(db, req, "DECLINED")

    def remove_friend(self, db: Session, user: User, friend_user_id: str) -> bool:
        deleted = friend_repository.delete_friendship(db, user.id, friend_user_id)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Friendship record not found."
            )
        return True

    def get_friends(self, db: Session, user: User) -> List[FriendUserResponse]:
        tuples = friend_repository.get_accepted_friends(db, user.id)
        return [
            FriendUserResponse(
                id=u.id,
                name=u.name,
                email=u.email,
                profile_photo=u.profile_photo,
                friendship_date=date_val
            )
            for u, date_val in tuples
        ]

    def get_pending(self, db: Session, user: User) -> Dict[str, Any]:
        incoming = friend_repository.get_pending_incoming(db, user.id)
        outgoing = friend_repository.get_pending_outgoing(db, user.id)
        return {
            "incoming": incoming,
            "outgoing": outgoing
        }

    def search_users(self, db: Session, user: User, query: str) -> List[User]:
        if not query or len(query.strip()) < 2:
            return []
        return friend_repository.search_users(db, query, user.id)


friend_service = FriendService()
