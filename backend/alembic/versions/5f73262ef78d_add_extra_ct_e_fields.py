"""add extra CT-e fields

Revision ID: 5f73262ef78d
Revises: 
Create Date: 2025-04-09 21:52:06.031832

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '5f73262ef78d'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_index('ix_execucoes_id', table_name='execucoes')
    op.drop_table('execucoes')
    # ### end Alembic commands ###


def downgrade() -> None:
    """Downgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('execucoes',
    sa.Column('id', sa.INTEGER(), autoincrement=True, nullable=False),
    sa.Column('status', sa.VARCHAR(), autoincrement=False, nullable=True),
    sa.Column('resultado', sa.TEXT(), autoincrement=False, nullable=True),
    sa.Column('erro', sa.TEXT(), autoincrement=False, nullable=True),
    sa.Column('criado_em', postgresql.TIMESTAMP(timezone=True), server_default=sa.text('now()'), autoincrement=False, nullable=True),
    sa.PrimaryKeyConstraint('id', name='execucoes_pkey')
    )
    op.create_index('ix_execucoes_id', 'execucoes', ['id'], unique=False)
    # ### end Alembic commands ###
