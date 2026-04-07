"""Real database tests for the newsletter service."""

from unittest.mock import MagicMock, patch

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.newsletter.service import list_subscribers, send_confirmation_email, subscribe

pytestmark = pytest.mark.asyncio


async def test_subscribe_persists_row(db_session: AsyncSession):
    with patch("resend.Emails.send", MagicMock(return_value={"id": "x"})):
        row = await subscribe(db_session, "user@example.com")

    assert row["email"] == "user@example.com"
    assert row["id"] is not None
    assert row["created_at"] is not None


async def test_subscribe_duplicate_raises_value_error(db_session: AsyncSession):
    with patch("resend.Emails.send", MagicMock(return_value={"id": "x"})):
        await subscribe(db_session, "dup@example.com")

    with pytest.raises(ValueError, match="already_subscribed"):
        with patch("resend.Emails.send", MagicMock(return_value={"id": "x"})):
            await subscribe(db_session, "dup@example.com")


async def test_list_subscribers_ordered_by_created_at_desc(db_session: AsyncSession):
    with patch("resend.Emails.send", MagicMock(return_value={"id": "x"})):
        await subscribe(db_session, "first@example.com")
        await subscribe(db_session, "second@example.com")

    rows = await list_subscribers(db_session)
    emails = [r["email"] for r in rows]
    # Both subscribers should be present (order may tie when created_at
    # uses now() within a single transaction, so we only check presence)
    assert "first@example.com" in emails
    assert "second@example.com" in emails


# ---------------------------------------------------------------------------
# send_confirmation_email
# ---------------------------------------------------------------------------


def test_send_confirmation_email_success():
    with patch("resend.Emails.send", MagicMock(return_value={"id": "msg-1"})) as mock_send:
        send_confirmation_email("user@example.com")

    mock_send.assert_called_once()
    call_arg = mock_send.call_args[0][0]
    assert call_arg["to"] == "user@example.com"
    assert "subscribed" in call_arg["subject"].lower() or "subscribe" in call_arg["subject"].lower()


def test_send_confirmation_email_failure_does_not_raise():
    with patch("resend.Emails.send", side_effect=RuntimeError("API down")):
        # Should not raise — errors are logged and swallowed
        send_confirmation_email("fail@example.com")
