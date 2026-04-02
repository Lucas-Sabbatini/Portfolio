import logging

import resend

from app.config import get_settings
from app.database import get_pool

logger = logging.getLogger(__name__)


async def subscribe(email: str) -> dict:
    """Insert subscriber and send confirmation email. Raises ValueError on duplicate."""
    try:
        pool = await get_pool()
        row = await pool.fetchrow(
            "INSERT INTO newsletter_subscribers (email) VALUES ($1) RETURNING *",
            email,
        )
        logger.info("New newsletter subscriber: %s", email)
    except Exception as exc:
        # asyncpg raises asyncpg.UniqueViolationError for duplicates
        if "unique" in str(exc).lower() or "duplicate" in str(exc).lower():
            raise ValueError("already_subscribed") from exc
        logger.error("Database error subscribing: %s", email, exc_info=True)
        raise

    # Send confirmation email (best-effort)
    try:
        settings = get_settings()
        resend.api_key = settings.resend_api_key
        resend.Emails.send(
            {
                "from": settings.resend_from_email,
                "to": email,
                "subject": "You're subscribed!",
                "html": "<p>Thanks for subscribing to the newsletter.</p>",
            }
        )
        logger.info("Confirmation email sent to: %s", email)
    except Exception:
        logger.error("Failed to send confirmation email to: %s", email, exc_info=True)

    return dict(row)


async def list_subscribers() -> list[dict]:
    try:
        pool = await get_pool()
        rows = await pool.fetch(
            "SELECT id, email, created_at FROM newsletter_subscribers ORDER BY created_at DESC"
        )
        return [dict(r) for r in rows]
    except Exception:
        logger.error("Database error listing subscribers", exc_info=True)
        raise
