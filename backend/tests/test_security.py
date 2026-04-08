"""Tests for security features: rate limiting, account lockout, MFA, IP whitelist, security headers."""

from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, MagicMock, patch

import jwt
import pytest
from httpx import AsyncClient

from app.auth.mfa import generate_totp_secret, get_provisioning_uri, verify_totp
from app.rate_limit import (
    _failed_attempts,
    clear_failed_logins,
    is_account_locked,
    limiter,
    record_failed_login,
)

# ---------------------------------------------------------------------------
# Account lockout (in-memory)
# ---------------------------------------------------------------------------


@pytest.fixture(autouse=True)
def _clear_lockout_and_rate_limit():
    _failed_attempts.clear()
    limiter.reset()
    yield
    _failed_attempts.clear()
    limiter.reset()


def test_account_not_locked_initially():
    assert is_account_locked("test@example.com") is False


def test_account_locks_after_max_failures():
    for _ in range(10):
        record_failed_login("test@example.com")
    assert is_account_locked("test@example.com") is True


def test_account_not_locked_under_threshold():
    for _ in range(9):
        record_failed_login("test@example.com")
    assert is_account_locked("test@example.com") is False


def test_clear_failed_logins_unlocks():
    for _ in range(10):
        record_failed_login("test@example.com")
    clear_failed_logins("test@example.com")
    assert is_account_locked("test@example.com") is False


def test_lockout_is_per_email():
    for _ in range(10):
        record_failed_login("locked@example.com")
    assert is_account_locked("locked@example.com") is True
    assert is_account_locked("other@example.com") is False


# ---------------------------------------------------------------------------
# TOTP helpers
# ---------------------------------------------------------------------------


def test_generate_totp_secret_length():
    secret = generate_totp_secret()
    assert len(secret) == 32  # pyotp default base32 length


def test_provisioning_uri_format():
    uri = get_provisioning_uri("JBSWY3DPEHPK3PXP", "admin@example.com")
    assert uri.startswith("otpauth://totp/")
    assert "admin%40example.com" in uri or "admin@example.com" in uri
    assert "secret=JBSWY3DPEHPK3PXP" in uri


def test_verify_totp_valid():
    import pyotp

    secret = pyotp.random_base32()
    totp = pyotp.TOTP(secret)
    code = totp.now()
    assert verify_totp(secret, code) is True


def test_verify_totp_invalid():
    secret = generate_totp_secret()
    assert verify_totp(secret, "000000") is False


# ---------------------------------------------------------------------------
# Security headers
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_security_headers_present(client: AsyncClient, mock_db):
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.headers["X-Content-Type-Options"] == "nosniff"
    assert response.headers["X-Frame-Options"] == "DENY"
    assert response.headers["Referrer-Policy"] == "strict-origin-when-cross-origin"
    assert response.headers["Permissions-Policy"] == "camera=(), microphone=(), geolocation=()"


# ---------------------------------------------------------------------------
# Account lockout integration (login endpoint)
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_login_blocked_when_account_locked(client: AsyncClient, mock_db):
    for _ in range(10):
        record_failed_login("locked@example.com")

    response = await client.post(
        "/api/auth/login",
        json={"email": "locked@example.com", "password": "anything"},
    )
    assert response.status_code == 403
    assert response.json()["detail"] == "Account temporarily locked"


# ---------------------------------------------------------------------------
# MFA login flow
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_login_returns_mfa_required_when_totp_enrolled(client: AsyncClient, mock_db):
    with patch("app.auth.router.authenticate_admin", new_callable=AsyncMock) as mock_auth:
        mock_auth.return_value = {
            "id": "test-id",
            "email": "admin@example.com",
            "totp_secret": "JBSWY3DPEHPK3PXP",
        }
        response = await client.post(
            "/api/auth/login",
            json={"email": "admin@example.com", "password": "secret"},
        )

    assert response.status_code == 200
    assert response.json()["message"] == "mfa_required"
    assert "mfa_token" in response.cookies


@pytest.mark.asyncio
async def test_login_skips_mfa_when_not_enrolled(client: AsyncClient, mock_db):
    with patch("app.auth.router.authenticate_admin", new_callable=AsyncMock) as mock_auth:
        mock_auth.return_value = {
            "id": "test-id",
            "email": "admin@example.com",
            "totp_secret": None,
        }
        response = await client.post(
            "/api/auth/login",
            json={"email": "admin@example.com", "password": "secret"},
        )

    assert response.status_code == 200
    assert response.json()["message"] == "ok"
    assert "access_token" in response.cookies


@pytest.mark.asyncio
async def test_mfa_verify_without_token(client: AsyncClient, mock_db):
    response = await client.post(
        "/api/auth/mfa/verify",
        json={"code": "123456"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_mfa_verify_with_expired_token(client: AsyncClient, mock_db):
    from app.config import get_settings

    get_settings.cache_clear()
    settings = get_settings()
    expired_token = jwt.encode(
        {
            "email": "admin@example.com",
            "id": "test-id",
            "purpose": "mfa",
            "exp": int((datetime.now(UTC) - timedelta(minutes=1)).timestamp()),
        },
        settings.secret_key,
        algorithm="HS256",
    )
    response = await client.post(
        "/api/auth/mfa/verify",
        json={"code": "123456"},
        cookies={"mfa_token": expired_token},
    )
    assert response.status_code == 401


# ---------------------------------------------------------------------------
# IP whitelist
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_login_blocked_by_ip_whitelist(client: AsyncClient, mock_db):
    with patch("app.auth.ip_whitelist.get_settings") as mock_settings:
        s = MagicMock()
        s.admin_ip_whitelist = "192.168.1.100"
        s.trust_proxy = False
        mock_settings.return_value = s

        response = await client.post(
            "/api/auth/login",
            json={"email": "admin@example.com", "password": "secret"},
        )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_login_allowed_when_whitelist_empty(client: AsyncClient, mock_db):
    """Empty whitelist means no restriction -- login proceeds normally."""
    with patch("app.auth.router.authenticate_admin", new_callable=AsyncMock) as mock_auth:
        mock_auth.return_value = {
            "id": "test-id",
            "email": "admin@example.com",
            "totp_secret": None,
        }
        response = await client.post(
            "/api/auth/login",
            json={"email": "admin@example.com", "password": "secret"},
        )
    assert response.status_code == 200


# ---------------------------------------------------------------------------
# MFA dependency (get_mfa_pending_admin)
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_mfa_token_with_wrong_purpose_rejected(client: AsyncClient, mock_db):
    from app.config import get_settings

    get_settings.cache_clear()
    settings = get_settings()
    bad_token = jwt.encode(
        {
            "email": "admin@example.com",
            "id": "test-id",
            "purpose": "not_mfa",
            "exp": int((datetime.now(UTC) + timedelta(minutes=5)).timestamp()),
        },
        settings.secret_key,
        algorithm="HS256",
    )
    response = await client.post(
        "/api/auth/mfa/verify",
        json={"code": "123456"},
        cookies={"mfa_token": bad_token},
    )
    assert response.status_code == 401
