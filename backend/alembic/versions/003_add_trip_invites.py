"""add trip_invites table

Revision ID: 003_add_trip_invites
Revises: 002_friends_groups_trips
Create Date: 2026-09-21 13:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '003_add_trip_invites'
down_revision: Union[str, None] = '002_friends_groups_trips'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'trip_invites',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('trip_id', sa.String(length=36), nullable=False),
        sa.Column('code', sa.String(length=64), nullable=False),
        sa.Column('token_hash', sa.String(length=255), nullable=True),
        sa.Column('created_by_id', sa.String(length=36), nullable=False),
        sa.Column('expires_at', sa.DateTime(), nullable=True),
        sa.Column('max_uses', sa.Integer(), nullable=True),
        sa.Column('use_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('require_approval', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['created_by_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['trip_id'], ['trips.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('code')
    )
    op.create_index(op.f('ix_trip_invites_id'), 'trip_invites', ['id'], unique=False)
    op.create_index(op.f('ix_trip_invites_trip_id'), 'trip_invites', ['trip_id'], unique=False)
    op.create_index(op.f('ix_trip_invites_code'), 'trip_invites', ['code'], unique=False)
    op.create_index(op.f('ix_trip_invites_token_hash'), 'trip_invites', ['token_hash'], unique=False)
    op.create_index(op.f('ix_trip_invites_created_by_id'), 'trip_invites', ['created_by_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_trip_invites_created_by_id'), table_name='trip_invites')
    op.drop_index(op.f('ix_trip_invites_token_hash'), table_name='trip_invites')
    op.drop_index(op.f('ix_trip_invites_code'), table_name='trip_invites')
    op.drop_index(op.f('ix_trip_invites_trip_id'), table_name='trip_invites')
    op.drop_index(op.f('ix_trip_invites_id'), table_name='trip_invites')
    op.drop_table('trip_invites')
