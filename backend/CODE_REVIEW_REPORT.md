# Code Review Report — Blog API (FastAPI)

**Date:** 2026-04-06
**Reviewer:** FastAPI Expert Audit (automated)
**Branch:** `feature/parametrization`

---

## Executive Summary

**Health Score: 7.0 / 10** — Solid foundation with good practices.

The project follows a clean modular architecture (router/service/schema separation), uses async SQLAlchemy correctly, and has proper authentication via HTTP-only cookies. However, there are several security issues (one critical), some blocking I/O in async context, and missed Pydantic V2 optimization opportunities.

**Strengths:**
- Clean module separation (auth, posts, content, newsletter, upload, post_images)
- Proper async SQLAlchemy with session management and rollback
- Magic-byte file validation on uploads (not trusting Content-Type)
- ORM models use modern `Mapped[]` / `mapped_column` syntax
- Parameterized queries throughout (no raw SQL injection risk)

**Weaknesses:**
- Blocking I/O calls inside `async def` endpoints
- Cookie missing `secure=True` flag
- Deprecated FastAPI lifecycle API
- Overly broad exception handling masking real errors

---

## Critical Vulnerabilities

### CRITICAL: Blocking I/O in async event loop

**File:** `app/newsletter/service.py:31-39`

The `resend.Emails.send()` call is a **synchronous HTTP request** executed inside an `async def` function. This blocks the entire event loop, stalling all concurrent requests.

```python
# Current State (BLOCKING)
resend.Emails.send({...})
```

```python
# Recommended State
import asyncio
await asyncio.to_thread(resend.Emails.send, {...})

# Or better — use FastAPI BackgroundTasks:
from fastapi import BackgroundTasks

# In the router:
@router.post("/subscribe", status_code=201)
async def subscribe(body: SubscribeRequest, bg: BackgroundTasks, session=Depends(get_session)):
    row = await service.subscribe(session, str(body.email))
    bg.add_task(service.send_confirmation_email, row["email"])
    return {"id": str(row["id"]), "email": row["email"]}
```

**Severity:** Critical — blocks all concurrent requests during email send.

---

### HIGH: Blocking file I/O in async endpoints

**File:** `app/upload/router.py:51` and `app/post_images/router.py:61`

`dest.write_bytes(contents)` is synchronous disk I/O inside `async def` handlers.

```python
# Current State
dest.write_bytes(contents)
```

```python
# Recommended State
import aiofiles

async with aiofiles.open(dest, "wb") as f:
    await f.write(contents)
```

Note: `aiofiles` is already in `requirements.txt` but never used.

---

### HIGH: Login cookie missing `secure=True`

**File:** `app/auth/router.py:41-47`

```python
# Current State
response.set_cookie(
    key="access_token",
    value=token,
    httponly=True,
    samesite="strict",
    path="/",
)
```

```python
# Recommended State
response.set_cookie(
    key="access_token",
    value=token,
    httponly=True,
    secure=True,          # only sent over HTTPS
    samesite="strict",
    max_age=settings.access_token_expire_hours * 3600,
    path="/",
)
```

Without `secure=True`, the cookie is transmitted over plain HTTP, exposing the JWT to network sniffing. Also, no `max_age` means the cookie becomes a session cookie (cleared when the browser closes), which may not match the JWT's 8-hour expiry.

---

### HIGH: `resend.api_key` set globally per request

**File:** `app/newsletter/service.py:31`

```python
resend.api_key = settings.resend_api_key
```

This mutates a global module attribute on every subscribe call. In a concurrent environment, this is a race condition. Set it once at startup instead.

```python
# Recommended: in app/main.py or a startup event
import resend
from app.config import get_settings

settings = get_settings()
resend.api_key = settings.resend_api_key
```

---

### MEDIUM: Deprecated `@app.on_event("shutdown")`

**File:** `app/main.py:55-57`

```python
# Current State
@app.on_event("shutdown")
async def shutdown() -> None:
    await close_engine()
```

```python
# Recommended State
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    await close_engine()

app = FastAPI(title="Blog API", lifespan=lifespan)
```

`on_event` is deprecated since FastAPI 0.109 and will be removed.

---

### MEDIUM: Auth silently swallows database errors

**File:** `app/auth/service.py:36-41`

```python
# Current State
try:
    result = await session.execute(select(AdminUser).where(AdminUser.email == email))
    row = result.scalar_one_or_none()
except Exception:
    logger.error("Database error during authentication", exc_info=True)
    return None  # looks like "invalid credentials" to the caller
```

If the database is down, the user gets a 401 "Invalid credentials" instead of a 500. This makes outages very hard to debug from the client side.

```python
# Recommended State — let it propagate
result = await session.execute(select(AdminUser).where(AdminUser.email == email))
row = result.scalar_one_or_none()
```

The router's generic exception handler or FastAPI's default 500 will handle it.

---

### MEDIUM: JWT `exp` claim set as float instead of int

**File:** `app/auth/service.py:29`

```python
# Current State
to_encode["exp"] = expire.timestamp()  # returns float like 1712419200.123456
```

```python
# Recommended State
to_encode["exp"] = int(expire.timestamp())

# Or simpler — python-jose accepts datetime directly:
to_encode["exp"] = expire
```

Per RFC 7519, `exp` should be a NumericDate (integer). While `python-jose` handles floats, other JWT libraries consuming these tokens may not.

---

### MEDIUM: `allow_methods=["*"]` and `allow_headers=["*"]` in CORS

**File:** `app/main.py:30-33`

Wildcard methods and headers are overly permissive. This is acceptable for a personal blog, but for production best practice:

```python
# Recommended State
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "Cookie"],
)
```

---

### MEDIUM: File deletion without verifying post ownership

**File:** `app/post_images/router.py:67-85`

The `delete_post_image` endpoint accepts `post_id` and `image_id` but the service's `delete_image` only checks `image_id`. An admin could delete an image belonging to a different post than the URL suggests. While this is low risk (admin-only), it violates the principle of least surprise.

```python
# Recommended: verify image belongs to post
async def delete_image(session: AsyncSession, post_id: str, image_id: str) -> str | None:
    result = await session.execute(
        select(PostImage).where(PostImage.id == image_id, PostImage.post_id == post_id)
    )
    ...
```

---

### LOW: No rate limiting on login or subscribe endpoints

No rate limiting is applied to `/api/auth/login` or `/api/newsletter/subscribe`. These are brute-force and spam vectors respectively. Consider `slowapi` or a reverse proxy rate limit.

---

### LOW: Uploaded file path traversal — minimal risk

**File:** `app/post_images/router.py:80-81`

```python
relative = url.removeprefix("/uploads/")
file_path = Path(settings.upload_dir) / relative
```

The `url` comes from the database (written by the service), not from user input directly, so this is low risk. However, if the DB were compromised, a crafted `url` like `/uploads/../../etc/passwd` would resolve outside the upload directory.

```python
# Hardened version
file_path = (Path(settings.upload_dir) / relative).resolve()
if not str(file_path).startswith(str(Path(settings.upload_dir).resolve())):
    raise HTTPException(status_code=400, detail="Invalid path")
```

---

## Architectural Findings

### 1. `orm_to_dict` manual serialization vs. Pydantic `from_attributes`

The codebase converts ORM objects to dicts via a manual `orm_to_dict()` helper, then reconstructs Pydantic models in routers. Pydantic V2's `from_attributes=True` eliminates this entire layer.

```python
# Current State (app/utils.py + every router)
data = orm_to_dict(row)
return PostResponse(id=str(row["id"]), **{k: row[k] for k in row if k != "id"})
```

```python
# Recommended State
class PostResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID  # use UUID directly, not str
    slug: str
    ...

# In router:
return PostResponse.model_validate(row)
```

This removes `orm_to_dict`, the dict unpacking gymnastics, and the manual `str(id)` conversion — all at once.

### 2. Duplicate schema pairs (Create/Update)

`PostCreate` and `PostUpdate` are identical. Same for `ExperienceCreate`/`ExperienceUpdate`, `SkillCreate`/`SkillUpdate`, `SocialLinkCreate`/`SocialLinkUpdate`.

```python
# Recommended: single base with optional overrides
class PostWrite(BaseModel):
    title: str
    excerpt: str
    body: str = ""
    tag: str
    slug: str | None = None
    cover_image: str | None = None
    read_time: str | None = None
    status: str = "draft"
```

### 3. Overly broad `try/except` in every route handler

Nearly every endpoint wraps the entire body in `try/except Exception`, converting all errors to generic 500s. This:
- Hides bugs (e.g., `KeyError`, `TypeError`)
- Makes debugging harder
- Duplicates the same pattern ~20 times

Let unexpected exceptions propagate naturally — FastAPI returns 500 by default. Only catch expected, recoverable errors.

### 4. Service functions accept many positional arguments

```python
# Current State (app/content/service.py)
await service.create_social_link(session, body.platform, body.url, body.label, body.icon, body.color, body.sort_order)
```

```python
# Recommended: pass the schema object directly
await service.create_social_link(session, body)
```

This reduces coupling and makes adding fields a one-line change instead of touching router + service.

---

## Quick Wins

| # | Change | Files | Effort |
|---|--------|-------|--------|
| 1 | Add `secure=True` and `max_age` to login cookie | `app/auth/router.py` | 2 min |
| 2 | Move `resend.api_key = ...` to app startup | `app/main.py`, `app/newsletter/service.py` | 5 min |
| 3 | Replace `@app.on_event("shutdown")` with `lifespan` | `app/main.py` | 5 min |
| 4 | Use `asyncio.to_thread` or `BackgroundTasks` for email send | `app/newsletter/service.py` | 10 min |
| 5 | Use `aiofiles` for `write_bytes` (already a dependency) | `app/upload/router.py`, `app/post_images/router.py` | 5 min |
| 6 | Add `from_attributes=True` to response schemas, drop `orm_to_dict` | All schemas + routers | 30 min |
| 7 | Remove blanket `try/except` from route handlers | All routers | 15 min |
| 8 | Use `Annotated` type aliases for common dependencies | All routers | 10 min |

Example for #8:
```python
from typing import Annotated
from fastapi import Depends

DbSession = Annotated[AsyncSession, Depends(get_session)]
AdminUser = Annotated[dict[str, str], Depends(get_current_admin)]

@router.post("", response_model=PostResponse, status_code=201)
async def create_post(body: PostCreate, _admin: AdminUser, session: DbSession) -> PostResponse:
    ...
```

---

## Dependency Audit

| Package | Pinned | Status | Notes |
|---------|--------|--------|-------|
| `fastapi>=0.109.0` | No upper bound | **OK** | Current latest is ~0.115+. Consider pinning major. |
| `python-jose[cryptography]>=3.3.0` | No upper bound | **Deprecated** | `python-jose` is unmaintained. Migrate to `PyJWT` or `joserfc`. |
| `passlib[bcrypt]>=1.7.4` | No upper bound | **Deprecated** | passlib is unmaintained (DeprecationWarnings in pyproject confirm this). Consider `bcrypt` directly or `pwdlib`. |
| `bcrypt==4.0.1` | Hard-pinned | **Outdated** | Latest is 4.2+. The hard pin may conflict with passlib's bcrypt requirement. |
| `pydantic>=2.5.0` | No upper bound | OK | |
| `resend>=0.8.0` | No upper bound | OK | |
| `aiofiles>=23.0.0` | No upper bound | **Unused** | Listed in requirements but never imported. Either use it (see Quick Win #5) or remove. |
| `httpx>=0.26.0` | No upper bound | OK | Listed in both prod and dev requirements (duplicate). Only needed for dev/tests. |

**Key recommendation:** Replace `python-jose` with `PyJWT` — it's actively maintained, has fewer dependencies, and is a near drop-in replacement:

```python
# Before (python-jose)
from jose import jwt, JWTError
jwt.encode(payload, key, algorithm="HS256")
jwt.decode(token, key, algorithms=["HS256"])

# After (PyJWT)
import jwt
jwt.encode(payload, key, algorithm="HS256")
jwt.decode(token, key, algorithms=["HS256"])
# Catch: jwt.exceptions.PyJWTError instead of JWTError
```

---

## Summary of Findings by Severity

| Severity | Count | Key Issues |
|----------|-------|------------|
| Critical | 1 | Blocking `resend.Emails.send()` in async context |
| High | 3 | Blocking file I/O, insecure cookie, global API key mutation |
| Medium | 4 | Deprecated lifecycle, swallowed DB errors, JWT exp type, CORS wildcards |
| Low | 2 | No rate limiting, theoretical path traversal |

---