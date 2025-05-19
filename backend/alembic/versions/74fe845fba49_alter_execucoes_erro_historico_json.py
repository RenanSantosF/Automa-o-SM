"""alter execucoes: erro -> historico json

Revision ID: 74fe845fba49
Revises: eeeaf304d650
Create Date: 2025-05-19 16:40:03.376360

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '74fe845fba49'
down_revision: Union[str, None] = 'eeeaf304d650'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    # Remove a coluna erro
    op.drop_column('execucoes', 'erro')
    # Adiciona a coluna historico do tipo JSON
    op.add_column('execucoes', sa.Column('historico', postgresql.JSON(), nullable=True))

def downgrade():
    # Volta atrás: remove historico
    op.drop_column('execucoes', 'historico')
    # Adiciona a coluna erro como String
    op.add_column('execucoes', sa.Column('erro', sa.String(), nullable=True))
