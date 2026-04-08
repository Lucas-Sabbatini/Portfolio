"""add totp_secret column to admin_users

Revision ID: 004
Revises: 003
Create Date: 2026-04-07

"""

import sqlalchemy as sa
from alembic import op

revision = "004"
down_revision = "003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("admin_users", sa.Column("totp_secret", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("admin_users", "totp_secret")
