"""Remove variant from Image

Revision ID: e7ca14ea03b7
Revises: c968d7df1a3a
Create Date: 2025-01-26 03:40:08.647043

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'e7ca14ea03b7'
down_revision: Union[str, None] = 'c968d7df1a3a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('image', 'created_variants')
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('image', sa.Column('created_variants', sa.VARCHAR(), nullable=True))
    # ### end Alembic commands ###
