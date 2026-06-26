"""add influencer_profiles, social_accounts, metric_snapshots

Revision ID: 0003
Revises: 0002
Create Date: 2026-06-26
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0003"
down_revision: Union[str, None] = "0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "influencer_profiles",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("niche", sa.String(length=120), nullable=True),
        sa.Column("bio", sa.String(length=500), nullable=True),
        sa.Column("categories", postgresql.ARRAY(sa.String()), server_default="{}", nullable=False),
        sa.Column("verified", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id"),
    )
    op.create_index("ix_influencer_profiles_user_id", "influencer_profiles", ["user_id"], unique=True)

    # Use postgresql.ENUM with create_type=False and the SAME instance as the column type.
    # This mirrors 0001_baseline_users.py for the role enum — _check_for_name_in_memos
    # short-circuits on create_type=False, preventing a duplicate CREATE TYPE in
    # _on_table_create. checkfirst=True handles re-runs on existing databases.
    platform_enum = postgresql.ENUM("instagram", "youtube", name="platform", create_type=False)
    platform_enum.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "social_accounts",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("influencer_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("platform", platform_enum, nullable=False),
        sa.Column("followers", sa.Integer(), nullable=False),
        sa.Column("reach", sa.Integer(), nullable=False),
        sa.Column("engagement_rate", sa.Float(), nullable=False),
        sa.Column("connected_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["influencer_id"], ["influencer_profiles.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        comment="One row per platform per influencer; upsert on reconnect",
    )
    op.create_index("ix_social_accounts_influencer_id", "social_accounts", ["influencer_id"])
    op.create_unique_constraint(
        "uq_social_accounts_influencer_platform", "social_accounts", ["influencer_id", "platform"]
    )

    op.create_table(
        "metric_snapshots",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("influencer_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("platform", platform_enum, nullable=False),
        sa.Column("followers", sa.Integer(), nullable=False),
        sa.Column("reach", sa.Integer(), nullable=False),
        sa.Column("engagement_rate", sa.Float(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["influencer_id"], ["influencer_profiles.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_metric_snapshots_influencer_id", "metric_snapshots", ["influencer_id"])


def downgrade() -> None:
    op.drop_table("metric_snapshots")
    op.drop_constraint("uq_social_accounts_influencer_platform", "social_accounts", type_="unique")
    op.drop_table("social_accounts")
    op.drop_table("influencer_profiles")
    # Drop platform enum only if no other tables use it
    postgresql.ENUM(name="platform").drop(op.get_bind(), checkfirst=True)
