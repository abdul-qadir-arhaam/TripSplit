"""add expenses and expense_splits tables

Revision ID: 004_add_expenses_and_splits
Revises: 003_add_trip_invites
Create Date: 2026-09-22 13:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '004_add_expenses_and_splits'
down_revision: Union[str, None] = '003_add_trip_invites'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create expenses table
    op.create_table(
        'expenses',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('trip_id', sa.String(length=36), nullable=False),
        sa.Column('title', sa.String(length=150), nullable=False),
        sa.Column('amount', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('currency', sa.String(length=10), nullable=False, server_default='INR'),
        sa.Column('category', sa.String(length=50), nullable=False, server_default='Miscellaneous'),
        sa.Column('paid_by_member_id', sa.String(length=36), nullable=False),
        sa.Column('split_method', sa.String(length=20), nullable=False, server_default='EQUAL'),
        sa.Column('expense_date', sa.DateTime(), nullable=False),
        sa.Column('location_name', sa.String(length=255), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('receipt_url', sa.String(length=500), nullable=True),
        sa.Column('created_by_member_id', sa.String(length=36), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['created_by_member_id'], ['trip_members.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['paid_by_member_id'], ['trip_members.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['trip_id'], ['trips.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_expenses_id'), 'expenses', ['id'], unique=False)
    op.create_index(op.f('ix_expenses_trip_id'), 'expenses', ['trip_id'], unique=False)
    op.create_index(op.f('ix_expenses_category'), 'expenses', ['category'], unique=False)
    op.create_index(op.f('ix_expenses_paid_by_member_id'), 'expenses', ['paid_by_member_id'], unique=False)
    op.create_index(op.f('ix_expenses_expense_date'), 'expenses', ['expense_date'], unique=False)

    # 2. Create expense_splits table
    op.create_table(
        'expense_splits',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('expense_id', sa.String(length=36), nullable=False),
        sa.Column('member_id', sa.String(length=36), nullable=False),
        sa.Column('amount', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('split_value', sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['expense_id'], ['expenses.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['member_id'], ['trip_members.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_expense_splits_id'), 'expense_splits', ['id'], unique=False)
    op.create_index(op.f('ix_expense_splits_expense_id'), 'expense_splits', ['expense_id'], unique=False)
    op.create_index(op.f('ix_expense_splits_member_id'), 'expense_splits', ['member_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_expense_splits_member_id'), table_name='expense_splits')
    op.drop_index(op.f('ix_expense_splits_expense_id'), table_name='expense_splits')
    op.drop_index(op.f('ix_expense_splits_id'), table_name='expense_splits')
    op.drop_table('expense_splits')

    op.drop_index(op.f('ix_expenses_expense_date'), table_name='expenses')
    op.drop_index(op.f('ix_expenses_paid_by_member_id'), table_name='expenses')
    op.drop_index(op.f('ix_expenses_category'), table_name='expenses')
    op.drop_index(op.f('ix_expenses_trip_id'), table_name='expenses')
    op.drop_index(op.f('ix_expenses_id'), table_name='expenses')
    op.drop_table('expenses')
