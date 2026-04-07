import asyncio
import logging

import resend
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.models import NewsletterSubscriber
from app.utils import orm_to_dict

logger = logging.getLogger(__name__)


def send_confirmation_email(email: str) -> None:
    """Send confirmation email synchronously (called via asyncio.to_thread)."""
    settings = get_settings()
    try:
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


async def subscribe(session: AsyncSession, email: str) -> dict:
    """Insert subscriber and send confirmation email. Raises ValueError on duplicate."""
    subscriber = NewsletterSubscriber(email=email)
    session.add(subscriber)
    try:
        await session.flush()
    except IntegrityError as exc:
        await session.rollback()
        raise ValueError("already_subscribed") from exc

    await session.refresh(subscriber)
    logger.info("New newsletter subscriber: %s", email)

    # Send confirmation email (best-effort, non-blocking)
    await asyncio.to_thread(send_confirmation_email, email)

    return orm_to_dict(subscriber)


async def list_subscribers(session: AsyncSession) -> list[dict]:
    result = await session.execute(
        select(NewsletterSubscriber).order_by(NewsletterSubscriber.created_at.desc())
    )
    return [orm_to_dict(r) for r in result.scalars().all()]
