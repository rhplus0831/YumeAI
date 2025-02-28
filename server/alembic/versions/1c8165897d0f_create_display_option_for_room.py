"""Create display_option for Room

Revision ID: 1c8165897d0f
Revises: 361d87733b1b
Create Date: 2025-01-20 01:09:50.154716

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel

from database.sql_model import *



# revision identifiers, used by Alembic.
revision: str = '1c8165897d0f'
down_revision: Union[str, None] = '361d87733b1b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('room', sa.Column('display_option', sqlmodel.sql.sqltypes.AutoString(), nullable=True))
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('room', 'display_option')
    # ### end Alembic commands ###
