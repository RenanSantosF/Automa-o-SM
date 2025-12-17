"""rbac grupos permissoes

Revision ID: a3da8868d644
Revises: a6029ed5a6bb
Create Date: 2025-12-15 19:34:32.586988

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'a3da8868d644'
down_revision: Union[str, None] = 'a6029ed5a6bb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'grupos',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('nome', sa.String(), nullable=False),
        sa.Column('descricao', sa.String(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('nome')
    )

    op.create_table(
        'permissoes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('codigo', sa.String(), nullable=False),
        sa.Column('descricao', sa.String(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('codigo')
    )

    op.create_table(
        'grupo_permissoes',
        sa.Column('grupo_id', sa.Integer(), nullable=False),
        sa.Column('permissao_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['grupo_id'], ['grupos.id']),
        sa.ForeignKeyConstraint(['permissao_id'], ['permissoes.id']),
        sa.PrimaryKeyConstraint('grupo_id', 'permissao_id')
    )

    op.add_column(
        'users',
        sa.Column('grupo_id', sa.Integer(), nullable=True)
    )

    op.create_foreign_key(
        'fk_users_grupo',
        'users',
        'grupos',
        ['grupo_id'],
        ['id']
    )

def downgrade() -> None:
    op.drop_constraint('fk_users_grupo', 'users', type_='foreignkey')
    op.drop_column('users', 'grupo_id')

    op.drop_table('grupo_permissoes')
    op.drop_table('permissoes')
    op.drop_table('grupos')
