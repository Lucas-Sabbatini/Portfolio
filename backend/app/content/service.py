import logging

from app.database import get_pool

logger = logging.getLogger(__name__)


# --- Content blocks ---


async def get_content_section(section: str) -> dict[str, str]:
    try:
        pool = await get_pool()
        rows = await pool.fetch("SELECT key, value FROM content_blocks WHERE section = $1", section)
        return {r["key"]: r["value"] for r in rows}
    except Exception:
        logger.error("Database error getting content section: %s", section, exc_info=True)
        raise


async def upsert_content(section: str, key: str, value: str) -> None:
    try:
        pool = await get_pool()
        await pool.execute(
            "INSERT INTO content_blocks (section, key, value) VALUES ($1, $2, $3) "
            "ON CONFLICT (section, key) DO UPDATE SET value = $3, updated_at = now()",
            section,
            key,
            value,
        )
        logger.info("Upserted content block %s/%s", section, key)
    except Exception:
        logger.error("Database error upserting content %s/%s", section, key, exc_info=True)
        raise


# --- Experience ---


async def list_experience() -> list[dict]:
    try:
        pool = await get_pool()
        rows = await pool.fetch("SELECT * FROM experience_entries ORDER BY sort_order")
        return [dict(r) for r in rows]
    except Exception:
        logger.error("Database error listing experience", exc_info=True)
        raise


async def create_experience(
    role: str, company: str, period: str, description: list[str], sort_order: int
) -> dict:
    try:
        pool = await get_pool()
        row = await pool.fetchrow(
            "INSERT INTO experience_entries (role, company, period, description, sort_order) "
            "VALUES ($1, $2, $3, $4, $5) RETURNING *",
            role,
            company,
            period,
            description,
            sort_order,
        )
        logger.info("Created experience entry: %s at %s", role, company)
        return dict(row)
    except Exception:
        logger.error("Database error creating experience", exc_info=True)
        raise


async def update_experience(
    entry_id: str, role: str, company: str, period: str, description: list[str], sort_order: int
) -> dict | None:
    try:
        pool = await get_pool()
        row = await pool.fetchrow(
            "UPDATE experience_entries SET role = $1, company = $2, period = $3, "
            "description = $4, sort_order = $5, updated_at = now() WHERE id = $6 RETURNING *",
            role,
            company,
            period,
            description,
            sort_order,
            entry_id,
        )
        if row:
            logger.info("Updated experience entry: %s", entry_id)
        return dict(row) if row else None
    except Exception:
        logger.error("Database error updating experience: %s", entry_id, exc_info=True)
        raise


async def delete_experience(entry_id: str) -> bool:
    try:
        pool = await get_pool()
        result = await pool.execute("DELETE FROM experience_entries WHERE id = $1", entry_id)
        deleted = result == "DELETE 1"
        if deleted:
            logger.info("Deleted experience entry: %s", entry_id)
        return deleted
    except Exception:
        logger.error("Database error deleting experience: %s", entry_id, exc_info=True)
        raise


# --- Skills ---


async def list_skills() -> list[dict]:
    try:
        pool = await get_pool()
        rows = await pool.fetch("SELECT * FROM skills ORDER BY sort_order")
        return [dict(r) for r in rows]
    except Exception:
        logger.error("Database error listing skills", exc_info=True)
        raise


async def create_skill(name: str, category: str, icon: str | None, sort_order: int) -> dict:
    try:
        pool = await get_pool()
        row = await pool.fetchrow(
            "INSERT INTO skills (name, category, icon, sort_order) VALUES ($1, $2, $3, $4) RETURNING *",
            name,
            category,
            icon,
            sort_order,
        )
        logger.info("Created skill: %s", name)
        return dict(row)
    except Exception:
        logger.error("Database error creating skill", exc_info=True)
        raise


async def update_skill(
    skill_id: str, name: str, category: str, icon: str | None, sort_order: int
) -> dict | None:
    try:
        pool = await get_pool()
        row = await pool.fetchrow(
            "UPDATE skills SET name = $1, category = $2, icon = $3, sort_order = $4 WHERE id = $5 RETURNING *",
            name,
            category,
            icon,
            sort_order,
            skill_id,
        )
        if row:
            logger.info("Updated skill: %s", skill_id)
        return dict(row) if row else None
    except Exception:
        logger.error("Database error updating skill: %s", skill_id, exc_info=True)
        raise


async def delete_skill(skill_id: str) -> bool:
    try:
        pool = await get_pool()
        result = await pool.execute("DELETE FROM skills WHERE id = $1", skill_id)
        deleted = result == "DELETE 1"
        if deleted:
            logger.info("Deleted skill: %s", skill_id)
        return deleted
    except Exception:
        logger.error("Database error deleting skill: %s", skill_id, exc_info=True)
        raise


# --- Social links ---


async def list_social_links() -> list[dict]:
    try:
        pool = await get_pool()
        rows = await pool.fetch("SELECT * FROM social_links ORDER BY sort_order")
        return [dict(r) for r in rows]
    except Exception:
        logger.error("Database error listing social links", exc_info=True)
        raise


async def create_social_link(
    platform: str, url: str, label: str, icon: str | None, color: str | None, sort_order: int
) -> dict:
    try:
        pool = await get_pool()
        row = await pool.fetchrow(
            "INSERT INTO social_links (platform, url, label, icon, color, sort_order) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
            platform,
            url,
            label,
            icon,
            color,
            sort_order,
        )
        logger.info("Created social link: %s", platform)
        return dict(row)
    except Exception:
        logger.error("Database error creating social link", exc_info=True)
        raise


async def update_social_link(
    link_id: str, platform: str, url: str, label: str, icon: str | None, color: str | None, sort_order: int
) -> dict | None:
    try:
        pool = await get_pool()
        row = await pool.fetchrow(
            "UPDATE social_links SET platform = $1, url = $2, label = $3, icon = $4, color = $5, sort_order = $6 WHERE id = $7 RETURNING *",
            platform,
            url,
            label,
            icon,
            color,
            sort_order,
            link_id,
        )
        if row:
            logger.info("Updated social link: %s", link_id)
        return dict(row) if row else None
    except Exception:
        logger.error("Database error updating social link: %s", link_id, exc_info=True)
        raise


async def delete_social_link(link_id: str) -> bool:
    try:
        pool = await get_pool()
        result = await pool.execute("DELETE FROM social_links WHERE id = $1", link_id)
        deleted = result == "DELETE 1"
        if deleted:
            logger.info("Deleted social link: %s", link_id)
        return deleted
    except Exception:
        logger.error("Database error deleting social link: %s", link_id, exc_info=True)
        raise
