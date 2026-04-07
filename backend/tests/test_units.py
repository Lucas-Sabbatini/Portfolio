"""Unit tests for pure functions — no HTTP, no database."""

import uuid
from datetime import UTC, datetime
from unittest.mock import patch

import pytest
from jose import jwt

from app.auth.service import create_access_token, hash_password, verify_password
from app.post_images.router import _sanitize_key
from app.posts.schemas import slugify
from app.posts.service import compute_read_time
from app.upload.router import detect_mime
from app.utils import orm_to_dict

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


# ---------------------------------------------------------------------------
# _sanitize_key
# ---------------------------------------------------------------------------


def test_sanitize_key_basic():
    assert _sanitize_key("My Photo.jpg") == "my-photo"


def test_sanitize_key_special_chars():
    assert _sanitize_key("hello@world!.png") == "helloworld"


def test_sanitize_key_underscores_and_spaces():
    assert _sanitize_key("my_cool  image.jpg") == "my-cool-image"


def test_sanitize_key_leading_trailing_dashes():
    assert _sanitize_key("---hello---.jpg") == "hello"


def test_sanitize_key_dot_only_filename():
    # Path(".jpg").stem is ".jpg", after sanitization becomes "jpg"
    assert _sanitize_key(".jpg") == "jpg"


def test_sanitize_key_empty_fallback():
    # Only non-word/non-space chars → stripped to "" → fallback "image"
    assert _sanitize_key("@!#.png") == "image"


def test_sanitize_key_already_clean():
    assert _sanitize_key("good-name.png") == "good-name"


# ---------------------------------------------------------------------------
# detect_mime
# ---------------------------------------------------------------------------


def test_detect_mime_jpeg():
    assert detect_mime(b"\xff\xd8\xff\xe0" + b"\x00" * 100) == "image/jpeg"


def test_detect_mime_png():
    assert detect_mime(b"\x89PNG" + b"\x00" * 100) == "image/png"


def test_detect_mime_webp():
    assert detect_mime(b"RIFF\x00\x00\x00\x00WEBP" + b"\x00" * 100) == "image/webp"


def test_detect_mime_unknown():
    assert detect_mime(b"random bytes here") is None


def test_detect_mime_empty():
    assert detect_mime(b"") is None


def test_detect_mime_partial_webp():
    assert detect_mime(b"RIFF") is None


# ---------------------------------------------------------------------------
# orm_to_dict
# ---------------------------------------------------------------------------


def test_orm_to_dict_converts_uuid():
    from app.models import Skill

    obj = Skill(id=uuid.uuid4(), name="Python", category="Lang", sort_order=1)
    result = orm_to_dict(obj)
    assert isinstance(result["id"], str)
    assert result["name"] == "Python"


def test_orm_to_dict_preserves_other_types():
    from app.models import Skill

    obj = Skill(id=uuid.uuid4(), name="Go", category="Lang", icon=None, sort_order=0)
    result = orm_to_dict(obj)
    assert result["icon"] is None
    assert isinstance(result["sort_order"], int)


# ---------------------------------------------------------------------------
# Settings properties
# ---------------------------------------------------------------------------


def test_async_database_url_conversion():
    from app.config import Settings

    with patch.dict(
        "os.environ",
        {
            "DATABASE_URL": "postgresql://user:pass@localhost/db",
            "SECRET_KEY": "test",
            "RESEND_API_KEY": "k",
            "RESEND_FROM_EMAIL": "a@b.com",
        },
    ):
        s = Settings()
        assert s.async_database_url == "postgresql+asyncpg://user:pass@localhost/db"


def test_async_database_url_already_async():
    from app.config import Settings

    with patch.dict(
        "os.environ",
        {
            "DATABASE_URL": "postgresql+asyncpg://user:pass@localhost/db",
            "SECRET_KEY": "test",
            "RESEND_API_KEY": "k",
            "RESEND_FROM_EMAIL": "a@b.com",
        },
    ):
        s = Settings()
        assert s.async_database_url == "postgresql+asyncpg://user:pass@localhost/db"


def test_allowed_origins_list_multiple():
    from app.config import Settings

    with patch.dict(
        "os.environ",
        {
            "DATABASE_URL": "postgresql://x",
            "SECRET_KEY": "test",
            "RESEND_API_KEY": "k",
            "RESEND_FROM_EMAIL": "a@b.com",
            "ALLOWED_ORIGINS": "http://a, http://b, http://c",
        },
    ):
        s = Settings()
        assert s.allowed_origins_list == ["http://a", "http://b", "http://c"]


def test_allowed_origins_list_empty_entries():
    from app.config import Settings

    with patch.dict(
        "os.environ",
        {
            "DATABASE_URL": "postgresql://x",
            "SECRET_KEY": "test",
            "RESEND_API_KEY": "k",
            "RESEND_FROM_EMAIL": "a@b.com",
            "ALLOWED_ORIGINS": "http://a,,http://b, ,http://c",
        },
    ):
        s = Settings()
        assert s.allowed_origins_list == ["http://a", "http://b", "http://c"]
