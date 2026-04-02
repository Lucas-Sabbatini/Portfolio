import logging
from pathlib import Path
from typing import Optional

import asyncpg

from app.config import get_settings

logger = logging.getLogger(__name__)

_pool: Optional[asyncpg.Pool] = None

MIGRATIONS_DIR = Path(__file__).resolve().parent.parent / "migrations"


async def run_migrations(pool: asyncpg.Pool) -> None:
    for sql_file in sorted(MIGRATIONS_DIR.glob("*.sql")):
        sql = sql_file.read_text()
        try:
            await pool.execute(sql)
            logger.info("Migration applied: %s", sql_file.name)
        except Exception:
            logger.error("Migration failed: %s", sql_file.name, exc_info=True)
            raise


async def get_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        settings = get_settings()
        _pool = await asyncpg.create_pool(dsn=settings.database_url)
        logger.info("Database pool created")
        await run_migrations(_pool)
    return _pool


async def close_pool() -> None:
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None
        logger.info("Database pool closed")
