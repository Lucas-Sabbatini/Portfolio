import logging
from typing import Optional

import asyncpg
from supabase import create_client, Client

from app.config import get_settings

logger = logging.getLogger(__name__)

_pool: Optional[asyncpg.Pool] = None
_supabase: Optional[Client] = None


async def get_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        settings = get_settings()
        _pool = await asyncpg.create_pool(dsn=settings.database_url)
        logger.info("Database pool created")
    return _pool


def get_supabase() -> Client:
    global _supabase
    if _supabase is None:
        settings = get_settings()
        _supabase = create_client(settings.supabase_url, settings.supabase_service_role_key)
        logger.info("Supabase client initialized")
    return _supabase


async def close_pool() -> None:
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None
        logger.info("Database pool closed")
