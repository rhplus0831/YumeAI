"""Fix summary parent

Revision ID: 361d87733b1b
Revises: 840f5a7d2e04
Create Date: 2025-01-19 11:27:36.596985

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel

from database.sql_model import *



# revision identifiers, used by Alembic.
revision: str = '361d87733b1b'
down_revision: Union[str, None] = '840f5a7d2e04'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.drop_index(op.f('ix_summary_room_id'), table_name='summary')
    op.drop_index(op.f('ix_summary_parent'), table_name='summary')
    op.drop_index(op.f('ix_summary_is_top'), table_name='summary')
    op.drop_index(op.f('ix_summary_id'), table_name='summary')
    op.drop_index(op.f('ix_summary_created_at'), table_name='summary')
    op.drop_index(op.f('ix_summary_conversation_id'), table_name='summary')
    op.drop_table('summary')

    op.create_table('summary',
                    sa.Column('room_id', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
                    sa.Column('created_at', sa.DateTime(), nullable=False),
                    sa.Column('conversation_id', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
                    sa.Column('parent', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
                    sa.Column('content', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
                    sa.Column('keyword', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
                    sa.Column('is_top', sa.Boolean(), nullable=False),
                    sa.Column('id', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
                    sa.ForeignKeyConstraint(['conversation_id'], ['conversation.id'], ),
                    sa.ForeignKeyConstraint(['parent'], ['summary.id'], ),
                    sa.ForeignKeyConstraint(['room_id'], ['room.id'], ),
                    sa.PrimaryKeyConstraint('id')
                    )

    op.create_index(op.f('ix_summary_conversation_id'), 'summary', ['conversation_id'], unique=False)
    op.create_index(op.f('ix_summary_created_at'), 'summary', ['created_at'], unique=False)
    op.create_index(op.f('ix_summary_id'), 'summary', ['id'], unique=False)
    op.create_index(op.f('ix_summary_is_top'), 'summary', ['is_top'], unique=False)
    op.create_index(op.f('ix_summary_parent'), 'summary', ['parent'], unique=False)
    op.create_index(op.f('ix_summary_room_id'), 'summary', ['room_id'], unique=False)

    # ### end Alembic commands ###


def downgrade() -> None:
    op.drop_index(op.f('ix_summary_room_id'), table_name='summary')
    op.drop_index(op.f('ix_summary_parent'), table_name='summary')
    op.drop_index(op.f('ix_summary_is_top'), table_name='summary')
    op.drop_index(op.f('ix_summary_id'), table_name='summary')
    op.drop_index(op.f('ix_summary_created_at'), table_name='summary')
    op.drop_index(op.f('ix_summary_conversation_id'), table_name='summary')
    op.drop_table('summary')

    op.create_table('summary',
                    sa.Column('room_id', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
                    sa.Column('created_at', sa.DateTime(), nullable=False),
                    sa.Column('conversation_id', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
                    sa.Column('parent', sa.Integer(), nullable=True),
                    sa.Column('content', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
                    sa.Column('keyword', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
                    sa.Column('is_top', sa.Boolean(), nullable=False),
                    sa.Column('id', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
                    sa.ForeignKeyConstraint(['conversation_id'], ['conversation.id'], ),
                    sa.ForeignKeyConstraint(['parent'], ['summary.id'], ),
                    sa.ForeignKeyConstraint(['room_id'], ['room.id'], ),
                    sa.PrimaryKeyConstraint('id')
                    )
    op.create_index(op.f('ix_summary_conversation_id'), 'summary', ['conversation_id'], unique=False)
    op.create_index(op.f('ix_summary_created_at'), 'summary', ['created_at'], unique=False)
    op.create_index(op.f('ix_summary_id'), 'summary', ['id'], unique=False)
    op.create_index(op.f('ix_summary_is_top'), 'summary', ['is_top'], unique=False)
    op.create_index(op.f('ix_summary_parent'), 'summary', ['parent'], unique=False)
    op.create_index(op.f('ix_summary_room_id'), 'summary', ['room_id'], unique=False)

