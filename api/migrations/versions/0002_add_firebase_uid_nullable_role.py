"""add firebase_uid to users; make role nullable

Revision ID: 0002
Revises: 0001
Create Date: 2026-06-26

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users", sa.Column("firebase_uid", sa.String(), nullable=False, server_default="")
    )
    op.alter_column("users", "firebase_uid", server_default=None)
    op.create_unique_constraint("uq_users_firebase_uid", "users", ["firebase_uid"])
    op.create_index("ix_users_firebase_uid", "users", ["firebase_uid"], unique=True)
    op.alter_column("users", "role", nullable=True)


def downgrade() -> None:
    op.alter_column("users", "role", nullable=False)
    op.drop_index("ix_users_firebase_uid", table_name="users")
    op.drop_constraint("uq_users_firebase_uid", "users", type_="unique")
    op.drop_column("users", "firebase_uid")
