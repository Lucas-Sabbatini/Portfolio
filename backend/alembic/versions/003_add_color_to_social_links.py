"""add color column to social_links

Revision ID: 003
Revises: 002
Create Date: 2026-04-06

"""

import sqlalchemy as sa
from alembic import op

revision = "003"
down_revision = "002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("social_links", sa.Column("color", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("social_links", "color")
