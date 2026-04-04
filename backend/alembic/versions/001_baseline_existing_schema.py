"""baseline existing schema

Revision ID: 001
Revises:
Create Date: 2026-04-04

"""

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # The database schema already exists (created via migrations/*.sql).
    # This baseline migration intentionally does nothing.
    # Run `alembic stamp 001` on an existing database to mark it as current.
    pass


def downgrade() -> None:
    pass
