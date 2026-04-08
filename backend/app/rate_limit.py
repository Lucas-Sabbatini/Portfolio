import time

from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

# ---------------------------------------------------------------------------
# In-memory per-email account lockout (anti-brute-force)
# ---------------------------------------------------------------------------

_MAX_FAILURES = 10
_LOCKOUT_WINDOW = 15 * 60  # 15 minutes in seconds

# {email: [(timestamp, ...), ...]}
_failed_attempts: dict[str, list[float]] = {}


def record_failed_login(email: str) -> None:
    now = time.monotonic()
    attempts = _failed_attempts.setdefault(email, [])
    attempts.append(now)
    # Prune old entries
    _failed_attempts[email] = [t for t in attempts if now - t < _LOCKOUT_WINDOW]


def is_account_locked(email: str) -> bool:
    attempts = _failed_attempts.get(email)
    if not attempts:
        return False
    now = time.monotonic()
    recent = [t for t in attempts if now - t < _LOCKOUT_WINDOW]
    _failed_attempts[email] = recent
    return len(recent) >= _MAX_FAILURES


def clear_failed_logins(email: str) -> None:
    _failed_attempts.pop(email, None)
