"""Add image_assets for Bot

Revision ID: 9a48c7975a2b
Revises: 2a4f7bdcb022
Create Date: 2025-01-17 20:58:36.965602

"""
from typing import Sequence, Union

import sqlmodel
from alembic import op
import sqlalchemy as sa

from database.sql_model import *



# revision identifiers, used by Alembic.
revision: str = '9a48c7975a2b'
down_revision: Union[str, None] = '2a4f7bdcb022'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('bot', sa.Column('image_assets', sqlmodel.sql.sqltypes.AutoString(), nullable=True))
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('bot', 'image_assets')
    # ### end Alembic commands ###
