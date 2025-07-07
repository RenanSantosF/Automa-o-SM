"""add email to users

Revision ID: a6029ed5a6bb
Revises: 1a2b3c4d5e6f
Create Date: 2025-07-03 11:51:54.778053
"""

from alembic import op
import sqlalchemy as sa
from typing import Sequence, Union

revision = 'a6029ed5a6bb'
down_revision = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 1) Adiciona a coluna permitindo NULL temporariamente
    op.add_column(
        "users",
        sa.Column("email", sa.String(), nullable=True)   # <- nullable=True por enquanto
    )

    # 2) Preenche registros antigos (exemplos)
    #    a) se você já sabe todos os e‑mails, faça um UPDATE direto ou
    #    b) use um placeholder e depois atualize manualmente
    op.execute("""
        UPDATE users
        SET email = CONCAT('placeholder_', id, '@example.com')
        WHERE email IS NULL
    """)

    # 3) Agora que todos os registros têm valor, torna NOT NULL
    op.alter_column(
        "users", "email",
        existing_type=sa.String(),
        nullable=False
    )

    # 4) Cria índice/unique constraint
    op.create_index("ix_users_email", "users", ["email"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_users_email", table_name="users")
    op.drop_column("users", "email")
