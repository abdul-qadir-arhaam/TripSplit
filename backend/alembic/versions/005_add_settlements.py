"""add settlements table

Revision ID: 005_add_settlements
Revises: 004_add_expenses_and_splits
Create Date: 2026-09-22 14:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '005_add_settlements'
down_revision: Union[str, None] = '004_add_expenses_and_splits'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'settlements',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('trip_id', sa.String(length=36), nullable=False),
        sa.Column('from_member_id', sa.String(length=36), nullable=False),
        sa.Column('to_member_id', sa.String(length=36), nullable=False),
        sa.Column('amount', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('currency', sa.String(length=10), nullable=False, server_default='INR'),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='PENDING'),
        sa.Column('payment_date', sa.DateTime(), nullable=True),
        sa.Column('payment_method', sa.String(length=50), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_by_member_id', sa.String(length=36), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['created_by_member_id'], ['trip_members.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['from_member_id'], ['trip_members.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['to_member_id'], ['trip_members.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['trip_id'], ['trips.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_settlements_id'), 'settlements', ['id'], unique=False)
    op.create_index(op.f('ix_settlements_trip_id'), 'settlements', ['trip_id'], unique=False)
    op.create_index(op.f('ix_settlements_from_member_id'), 'settlements', ['from_member_id'], unique=False)
    op.create_index(op.f('ix_settlements_to_member_id'), 'settlements', ['to_member_id'], unique=False)
    op.create_index(op.f('ix_settlements_status'), 'settlements', ['status'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_settlements_status'), table_name='settlements')
    op.drop_index(op.f('ix_settlements_to_member_id'), table_name='settlements')
    op.drop_index(op.f('ix_settlements_from_member_id'), table_name='settlements')
    op.drop_index(op.f('ix_settlements_trip_id'), table_name='settlements')
    op.drop_index(op.f('ix_settlements_id'), table_name='settlements')
    op.drop_table('settlements')
