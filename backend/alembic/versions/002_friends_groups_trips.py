"""create friends, groups, and trips tables

Revision ID: 002_friends_groups_trips
Revises: 001_initial_users
Create Date: 2026-09-21 12:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '002_friends_groups_trips'
down_revision: Union[str, None] = '001_initial_users'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. friend_requests
    op.create_table(
        'friend_requests',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('sender_id', sa.String(length=36), nullable=False),
        sa.Column('receiver_id', sa.String(length=36), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='PENDING'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['receiver_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['sender_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_friend_requests_id'), 'friend_requests', ['id'], unique=False)
    op.create_index(op.f('ix_friend_requests_receiver_id'), 'friend_requests', ['receiver_id'], unique=False)
    op.create_index(op.f('ix_friend_requests_sender_id'), 'friend_requests', ['sender_id'], unique=False)
    op.create_index(op.f('ix_friend_requests_status'), 'friend_requests', ['status'], unique=False)

    # 2. groups
    op.create_table(
        'groups',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('owner_id', sa.String(length=36), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['owner_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_groups_id'), 'groups', ['id'], unique=False)
    op.create_index(op.f('ix_groups_owner_id'), 'groups', ['owner_id'], unique=False)

    # 3. group_members
    op.create_table(
        'group_members',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('group_id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['group_id'], ['groups.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('group_id', 'user_id', name='uq_group_member')
    )
    op.create_index(op.f('ix_group_members_group_id'), 'group_members', ['group_id'], unique=False)
    op.create_index(op.f('ix_group_members_id'), 'group_members', ['id'], unique=False)
    op.create_index(op.f('ix_group_members_user_id'), 'group_members', ['user_id'], unique=False)

    # 4. trips
    op.create_table(
        'trips',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('name', sa.String(length=150), nullable=False),
        sa.Column('destination', sa.String(length=150), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('start_date', sa.Date(), nullable=True),
        sa.Column('end_date', sa.Date(), nullable=True),
        sa.Column('budget', sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column('currency', sa.String(length=10), nullable=False, server_default='INR'),
        sa.Column('trip_type', sa.String(length=50), nullable=False, server_default='Vacation'),
        sa.Column('owner_id', sa.String(length=36), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='PLANNING'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['owner_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_trips_id'), 'trips', ['id'], unique=False)
    op.create_index(op.f('ix_trips_owner_id'), 'trips', ['owner_id'], unique=False)
    op.create_index(op.f('ix_trips_status'), 'trips', ['status'], unique=False)

    # 5. trip_members
    op.create_table(
        'trip_members',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('trip_id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=True),
        sa.Column('display_name', sa.String(length=100), nullable=False),
        sa.Column('member_type', sa.String(length=20), nullable=False, server_default='REGISTERED'),
        sa.Column('guest_token_hash', sa.String(length=255), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='ACTIVE'),
        sa.Column('role', sa.String(length=20), nullable=False, server_default='MEMBER'),
        sa.Column('joined_at', sa.DateTime(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['trip_id'], ['trips.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_trip_members_id'), 'trip_members', ['id'], unique=False)
    op.create_index(op.f('ix_trip_members_trip_id'), 'trip_members', ['trip_id'], unique=False)
    op.create_index(op.f('ix_trip_members_user_id'), 'trip_members', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_table('trip_members')
    op.drop_table('trips')
    op.drop_table('group_members')
    op.drop_table('groups')
    op.drop_table('friend_requests')
