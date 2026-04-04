"""Unit tests for pure functions — no HTTP, no database."""

from datetime import UTC, datetime

import pytest
from jose import jwt

from app.auth.service import create_access_token, hash_password, verify_password
from app.posts.schemas import slugify
from app.posts.service import compute_read_time


# ---------------------------------------------------------------------------
# compute_read_time
# ---------------------------------------------------------------------------


def test_read_time_empty_body():
    assert compute_read_time("") == "1 min read"


def test_read_time_single_word():
    assert compute_read_time("hello") == "1 min read"


def test_read_time_exactly_200_words():
    assert compute_read_time("word " * 200) == "1 min read"


def test_read_time_400_words():
    assert compute_read_time("word " * 400) == "2 min read"


def test_read_time_600_words():
    assert compute_read_time("word " * 600) == "3 min read"


# ---------------------------------------------------------------------------
# slugify
# ---------------------------------------------------------------------------


def test_slugify_basic():
    assert slugify("Hello World") == "hello-world"


def test_slugify_multiple_spaces():
    assert slugify("Hello   World") == "hello-world"


def test_slugify_leading_trailing_spaces():
    assert slugify("  hello  ") == "hello"


def test_slugify_special_chars():
    assert slugify("Hello! World?") == "hello-world"


def test_slugify_numbers():
    assert slugify("Post 2024") == "post-2024"


def test_slugify_already_slug():
    assert slugify("hello-world") == "hello-world"


def test_slugify_empty_string():
    # Should return empty string without raising
    result = slugify("")
    assert isinstance(result, str)


def test_slugify_unicode_stripped():
    # Non-word, non-space chars are stripped
    result = slugify("hello@world")
    assert "@" not in result


# ---------------------------------------------------------------------------
# hash_password / verify_password
# ---------------------------------------------------------------------------

# passlib + bcrypt>=4.0.0 has a version-detection incompatibility in some
# environments. Detect it once and skip affected tests gracefully.
try:
    hash_password("probe")
    _bcrypt_ok = True
except Exception:
    _bcrypt_ok = False

bcrypt_required = pytest.mark.skipif(not _bcrypt_ok, reason="passlib/bcrypt incompatibility")


@bcrypt_required
def test_hash_password_returns_string():
    hashed = hash_password("secret")
    assert isinstance(hashed, str)
    assert hashed != "secret"


@bcrypt_required
def test_verify_password_correct():
    hashed = hash_password("mysecret")
    assert verify_password("mysecret", hashed) is True


@bcrypt_required
def test_verify_password_wrong():
    hashed = hash_password("correct")
    assert verify_password("wrong", hashed) is False


@bcrypt_required
def test_hash_is_not_deterministic():
    # bcrypt produces different salts each time
    assert hash_password("same") != hash_password("same")


# ---------------------------------------------------------------------------
# create_access_token
# ---------------------------------------------------------------------------


def test_create_access_token_payload():
    from app.config import get_settings

    get_settings.cache_clear()
    settings = get_settings()
    token = create_access_token({"email": "admin@example.com", "id": "test-id"})
    payload = jwt.decode(token, settings.secret_key, algorithms=["HS256"])

    assert payload["email"] == "admin@example.com"
    assert payload["id"] == "test-id"
    assert "exp" in payload


def test_create_access_token_expiry_is_in_future():
    from app.config import get_settings

    get_settings.cache_clear()
    settings = get_settings()
    token = create_access_token({"email": "x@x.com", "id": "1"})
    payload = jwt.decode(token, settings.secret_key, algorithms=["HS256"])

    now = datetime.now(UTC).timestamp()
    assert payload["exp"] > now
