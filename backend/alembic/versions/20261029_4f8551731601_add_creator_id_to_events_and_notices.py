"""add_creator_id_to_events_and_notices

Revision ID: 4f8551731601
Revises: 0001_initial
Create Date: 2026-10-29 01:48:32.183358

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4f8551731601'
down_revision: Union[str, None] = '0001_initial'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('events', sa.Column('creator_id', sa.String(length=36), nullable=True))
    op.create_index(op.f('ix_events_creator_id'), 'events', ['creator_id'], unique=False)
    op.create_foreign_key(
        'fk_events_creator_id_users',
        'events',
        'users',
        ['creator_id'],
        ['id'],
        ondelete='SET NULL',
    )

    op.add_column('notices', sa.Column('creator_id', sa.String(length=36), nullable=True))
    op.create_index(op.f('ix_notices_creator_id'), 'notices', ['creator_id'], unique=False)
    op.create_foreign_key(
        'fk_notices_creator_id_users',
        'notices',
        'users',
        ['creator_id'],
        ['id'],
        ondelete='SET NULL',
    )


def downgrade() -> None:
    op.drop_constraint('fk_notices_creator_id_users', 'notices', type_='foreignkey')
    op.drop_index(op.f('ix_notices_creator_id'), table_name='notices')
    op.drop_column('notices', 'creator_id')

    op.drop_constraint('fk_events_creator_id_users', 'events', type_='foreignkey')
    op.drop_index(op.f('ix_events_creator_id'), table_name='events')
    op.drop_column('events', 'creator_id')
