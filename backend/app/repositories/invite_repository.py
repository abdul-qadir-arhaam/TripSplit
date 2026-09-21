from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.trip_invite import TripInvite


class InviteRepository:
    def create(
        self,
        db: Session,
        trip_id: str,
        created_by_id: str,
        code: str,
        token_hash: str,
        expires_at: Optional[datetime] = None,
        max_uses: Optional[int] = None,
        require_approval: bool = False,
    ) -> TripInvite:
        invite = TripInvite(
            trip_id=trip_id,
            created_by_id=created_by_id,
            code=code,
            token_hash=token_hash,
            expires_at=expires_at,
            max_uses=max_uses,
            use_count=0,
            is_active=True,
            require_approval=require_approval,
        )
        db.add(invite)
        db.commit()
        db.refresh(invite)
        return invite

    def get_by_id(self, db: Session, invite_id: str) -> Optional[TripInvite]:
        return db.query(TripInvite).filter(TripInvite.id == invite_id).first()

    def get_by_token_hash(self, db: Session, token_hash: str) -> Optional[TripInvite]:
        return db.query(TripInvite).filter(TripInvite.token_hash == token_hash).first()

    def get_by_code(self, db: Session, code: str) -> Optional[TripInvite]:
        return db.query(TripInvite).filter(TripInvite.code == code).first()

    def list_by_trip(self, db: Session, trip_id: str) -> List[TripInvite]:
        return (
            db.query(TripInvite)
            .filter(TripInvite.trip_id == trip_id)
            .order_by(TripInvite.created_at.desc())
            .all()
        )

    def get_active_by_trip(self, db: Session, trip_id: str) -> Optional[TripInvite]:
        now = datetime.now(timezone.utc)
        invites = (
            db.query(TripInvite)
            .filter(TripInvite.trip_id == trip_id, TripInvite.is_active.is_(True))
            .order_by(TripInvite.created_at.desc())
            .all()
        )
        for inv in invites:
            # Check if expired
            if inv.expires_at:
                exp = inv.expires_at
                if exp.tzinfo is None:
                    exp = exp.replace(tzinfo=timezone.utc)
                if exp <= now:
                    continue
            # Check max uses
            if inv.max_uses is not None and inv.use_count >= inv.max_uses:
                continue
            return inv
        return None

    def disable(self, db: Session, invite: TripInvite) -> TripInvite:
        invite.is_active = False
        invite.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(invite)
        return invite

    def update_token(
        self,
        db: Session,
        invite: TripInvite,
        new_code: str,
        new_token_hash: str,
        expires_at: Optional[datetime] = None,
        max_uses: Optional[int] = None,
    ) -> TripInvite:
        invite.code = new_code
        invite.token_hash = new_token_hash
        invite.expires_at = expires_at
        invite.max_uses = max_uses
        invite.use_count = 0
        invite.is_active = True
        invite.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(invite)
        return invite

    def increment_use_count(self, db: Session, invite: TripInvite) -> TripInvite:
        invite.use_count += 1
        invite.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(invite)
        return invite


invite_repository = InviteRepository()
