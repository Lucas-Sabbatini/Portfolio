# Agent Prompt — Blog Backend Implementation

## Your task

Implement the FastAPI backend for Lucas Janot's personal blog. The frontend already exists at `/home/lucass/Documents/blog` (React + Vite + TypeScript). You are creating a **new monorepo** that wraps both the existing frontend and the new backend.

Do not modify the frontend code unless explicitly instructed below. Your job is the backend and the monorepo wiring.

---

## Step 0 — Monorepo structure

Restructure the repository as follows:

```
/home/lucass/Documents/blog/        ← repo root
├── frontend/                       ← move all existing frontend files here
│   ├── src/
│   ├── public/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── postcss.config.js
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── auth/
│   │   │   ├── __init__.py
│   │   │   ├── router.py
│   │   │   ├── service.py
│   │   │   └── dependencies.py
│   │   ├── posts/
│   │   │   ├── __init__.py
│   │   │   ├── router.py
│   │   │   ├── service.py
│   │   │   └── schemas.py
│   │   ├── content/
│   │   │   ├── __init__.py
│   │   │   ├── router.py
│   │   │   ├── service.py
│   │   │   └── schemas.py
│   │   ├── newsletter/
│   │   │   ├── __init__.py
│   │   │   ├── router.py
│   │   │   └── service.py
│   │   └── upload/
│   │       ├── __init__.py
│   │       └── router.py
│   ├── tests/
│   │   ├── conftest.py
│   │   ├── test_auth.py
│   │   ├── test_posts.py
│   │   ├── test_content.py
│   │   └── test_newsletter.py
│   ├── migrations/
│   │   └── 001_initial.sql
│   ├── .env.example
│   ├── requirements.txt
│   ├── requirements-dev.txt
│   └── Dockerfile
├── docker-compose.yml              ← orchestrates backend + Umami
├── .gitignore
└── README.md
```

Move the existing frontend files into `frontend/`. Do not change any frontend source code. Update any relative path references that break as a result of the move (e.g. `vite.config.ts` if it has hardcoded paths).

---

## Tech stack

| Layer | Package |
|---|---|
| Language | Python 3.12 |
| Framework | FastAPI |
| DB client | `supabase-py` (Storage, RPC) + `asyncpg` (direct queries) |
| Validation | Pydantic v2 |
| Auth | `python-jose[cryptography]` + `passlib[bcrypt]` |
| Settings | `pydantic-settings` |
| Email | `resend` |
| HTTP client | `httpx` (for Umami proxy) |
| Server | `uvicorn` |
| Testing | `pytest` + `pytest-asyncio` + `httpx` (via `AsyncClient`) |

---

## Environment variables

Create `backend/.env.example` with all required variables. The app must refuse to start if any required variable is missing (use `pydantic-settings` with no defaults for secrets).

```
# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=                  # asyncpg DSN: postgresql+asyncpg://...

# Auth
SECRET_KEY=                    # random 32-byte hex string
ACCESS_TOKEN_EXPIRE_HOURS=8

# Admin seed (used by a one-time setup script, not the app itself)
ADMIN_EMAIL=
ADMIN_PASSWORD=

# Resend
RESEND_API_KEY=
RESEND_FROM_EMAIL=

# Umami (optional — only needed for the analytics proxy endpoint)
UMAMI_BASE_URL=
UMAMI_API_KEY=
UMAMI_WEBSITE_ID=

# CORS
ALLOWED_ORIGINS=http://localhost:5173,https://yourdomain.com
```

---

## Database migrations

Write raw SQL in `migrations/001_initial.sql`. The agent must not use an ORM for migrations — raw SQL only. All tables use `uuid` primary keys with `gen_random_uuid()`.

```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE admin_users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  created_at    timestamptz DEFAULT now()
);

CREATE TABLE posts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         text UNIQUE NOT NULL,
  title        text NOT NULL,
  excerpt      text NOT NULL,
  body         text NOT NULL DEFAULT '',
  tag          text NOT NULL CHECK (tag IN ('System Entry', 'Research', 'Archived', 'Drafting')),
  status       text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  cover_image  text,
  read_time    text,
  published_at timestamptz,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

CREATE TABLE content_blocks (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section    text NOT NULL,
  key        text NOT NULL,
  value      text NOT NULL,
  updated_at timestamptz DEFAULT now(),
  UNIQUE (section, key)
);

CREATE TABLE experience_entries (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role        text NOT NULL,
  company     text NOT NULL,
  period      text NOT NULL,
  description text[] NOT NULL DEFAULT '{}',
  sort_order  int NOT NULL DEFAULT 0,
  updated_at  timestamptz DEFAULT now()
);

CREATE TABLE skills (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  category   text NOT NULL,
  icon       text,
  sort_order int NOT NULL DEFAULT 0
);

CREATE TABLE social_links (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform   text NOT NULL,
  url        text NOT NULL,
  label      text NOT NULL,
  sort_order int NOT NULL DEFAULT 0
);

CREATE TABLE newsletter_subscribers (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email      text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);
```

---

## API specification

All routes are prefixed with `/api`. The app also serves `GET /health` (no prefix) returning `{"status": "ok"}`.

### Auth — `/api/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/login` | No | Body: `{email, password}`. Verifies credentials. On success sets `access_token` as `httpOnly; SameSite=Strict; Path=/` cookie. Returns `{"message": "ok"}`. |
| POST | `/api/auth/logout` | No | Clears the cookie. Returns `{"message": "ok"}`. |
| GET | `/api/auth/me` | Yes | Returns `{"email": "..."}` of the current admin. Returns 401 if not authenticated. |

Cookie auth: JWT signed with `HS256`, expiry from `ACCESS_TOKEN_EXPIRE_HOURS`. The `get_current_admin` FastAPI dependency reads the cookie, decodes the JWT, and raises 401 on any failure.

### Posts — `/api/posts`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/posts` | No | Returns list of published posts. Supports `?tag=` filter. Excludes `body` field in list responses for performance. |
| GET | `/api/posts/{slug}` | No | Returns full post including `body`. Returns 404 if not found or not published. |
| POST | `/api/posts` | Yes | Creates post. `slug` is auto-generated from `title` if not provided. Returns 201. |
| PUT | `/api/posts/{slug}` | Yes | Full update of a post. Returns 200. |
| DELETE | `/api/posts/{slug}` | Yes | Deletes post. Returns 204. |
| PATCH | `/api/posts/{slug}/publish` | Yes | Toggles `status` between `draft` and `published`. Sets `published_at` on first publish. Returns updated post. |

Slug generation (use this exact function):
```python
import re

def slugify(title: str) -> str:
    slug = title.lower().strip()
    slug = re.sub(r"[^\w\s-]", "", slug)
    slug = re.sub(r"[\s_-]+", "-", slug)
    return re.sub(r"^-+|-+$", "", slug)
```

`read_time` computation: if not provided, compute it server-side as `f"{max(1, len(body.split()) // 200)} min read"`.

### Content — `/api/content`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/content/{section}` | No | Returns all key-value pairs for a section as `{key: value, ...}`. |
| PATCH | `/api/content/{section}/{key}` | Yes | Body: `{"value": "..."}`. Upserts the content block. |
| GET | `/api/experience` | No | Returns list ordered by `sort_order`. |
| POST | `/api/experience` | Yes | Creates entry. Returns 201. |
| PUT | `/api/experience/{id}` | Yes | Full update. |
| DELETE | `/api/experience/{id}` | Yes | Returns 204. |
| GET | `/api/skills` | No | Returns list ordered by `sort_order`. |
| POST | `/api/skills` | Yes | Creates skill. Returns 201. |
| PUT | `/api/skills/{id}` | Yes | Full update. |
| DELETE | `/api/skills/{id}` | Yes | Returns 204. |
| GET | `/api/social-links` | No | Returns list ordered by `sort_order`. |
| POST | `/api/social-links` | Yes | Creates link. Returns 201. |
| PUT | `/api/social-links/{id}` | Yes | Full update. |
| DELETE | `/api/social-links/{id}` | Yes | Returns 204. |

### Upload — `/api/upload`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/upload` | Yes | Accepts `multipart/form-data` with a `file` field. Uploads to Supabase Storage bucket `covers`. Returns `{"url": "..."}` with the public URL. |

Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`. Max size: 5 MB. Return 422 if validation fails.

### Newsletter — `/api/newsletter`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/newsletter/subscribe` | No | Body: `{"email": "..."}`. Inserts subscriber. Sends confirmation email via Resend. Returns 201. Returns 409 if email already subscribed. |
| GET | `/api/newsletter/subscribers` | Yes | Returns list of all subscribers. |

### Analytics proxy — `/api/analytics`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/analytics/stats` | Yes | Proxies `GET /api/websites/{UMAMI_WEBSITE_ID}/stats` from Umami. Caches response in memory for 5 minutes. |

If `UMAMI_BASE_URL` is not set, return `{"error": "analytics not configured"}` with status 503.

---

## Application constraints

These are non-negotiable. Every constraint must be implemented, not just noted.

### Security
- JWT must be stored in `httpOnly` cookies only. Never return the token in the response body.
- CORS: only origins in `ALLOWED_ORIGINS` are permitted. Credentials must be allowed (`allow_credentials=True`).
- File uploads: validate MIME type by reading the first bytes (magic bytes), not just the `Content-Type` header. Reject files exceeding 5 MB before uploading to Supabase.
- All database queries use parameterized statements. No string interpolation in SQL.
- The `SUPABASE_SERVICE_ROLE_KEY` must never be exposed in any response or log.

### Reliability
- All database calls must be wrapped in try/except. On unexpected DB errors, return 500 with `{"detail": "internal server error"}` — never expose raw exception messages to the client.
- The `/health` endpoint must always return 200 regardless of DB connectivity (it is a liveness check, not a readiness check).

### Code style
- All Python files must have type annotations on every function signature.
- Pydantic models are the single source of truth for request/response shapes — no `dict` returns from route handlers.
- No business logic in routers. Routers call service functions; service functions call the DB.
- Settings are accessed only via the `get_settings()` dependency or the singleton `settings` object from `config.py`. Never use `os.environ` directly in application code.
- All service functions are `async`.

### Logging
- Use Python's `logging` module (not `print`).
- Log at `INFO` level: every incoming request method + path, every successful DB write.
- Log at `WARNING` level: failed login attempts (with the attempted email, not the password).
- Log at `ERROR` level: unexpected exceptions before returning 500.

---

## Tests

Use `pytest` + `pytest-asyncio` + `httpx.AsyncClient` pointed at the FastAPI `app` object (no live server, no live DB). All DB calls must be mocked with `unittest.mock.AsyncMock` or `pytest-mock`.

Create `backend/tests/conftest.py` with:
- An `app` fixture that returns the FastAPI application.
- A `client` fixture (`AsyncClient`) scoped to the function.
- A `mock_db` fixture that patches the `asyncpg` pool and `supabase-py` client.
- An `auth_cookie` fixture that returns a valid JWT cookie string for use in protected-route tests.

### Required test cases

**`test_auth.py`**
- `test_login_success` — valid credentials → 200, cookie is set
- `test_login_wrong_password` — wrong password → 401, no cookie
- `test_login_unknown_email` — unknown email → 401
- `test_me_authenticated` — valid cookie → 200 with email
- `test_me_unauthenticated` — no cookie → 401
- `test_logout` — clears cookie

**`test_posts.py`**
- `test_list_posts_public` — returns only published posts, no `body` field
- `test_list_posts_tag_filter` — `?tag=Research` filters correctly
- `test_get_post_by_slug` — returns full post including `body`
- `test_get_post_not_found` — 404 for unknown slug
- `test_get_draft_post_as_public` — draft post returns 404 for unauthenticated request
- `test_create_post_authenticated` — 201, slug auto-generated
- `test_create_post_unauthenticated` — 401
- `test_publish_post` — toggles status to published, sets `published_at`
- `test_delete_post` — 204, post no longer returned in list
- `test_read_time_auto_computed` — if `read_time` not provided, it is computed

**`test_content.py`**
- `test_get_content_section` — returns key-value map for section
- `test_patch_content_upserts` — creates block if not exists, updates if exists
- `test_patch_content_unauthenticated` — 401
- `test_get_experience_ordered` — returns entries sorted by `sort_order`
- `test_create_experience_authenticated` — 201
- `test_delete_experience` — 204

**`test_newsletter.py`**
- `test_subscribe_success` — 201, Resend SDK called once
- `test_subscribe_duplicate` — 409
- `test_subscribe_invalid_email` — 422
- `test_list_subscribers_authenticated` — returns list
- `test_list_subscribers_unauthenticated` — 401

Run tests with: `cd backend && pytest -v`

All tests must pass before the task is considered done.

---

## Docker Compose

`docker-compose.yml` at the repo root must define two services:

```yaml
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    env_file:
      - ./backend/.env
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

  umami:
    image: ghcr.io/umami-software/umami:postgresql-latest
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: ${UMAMI_DATABASE_URL}
      DATABASE_TYPE: postgresql
    depends_on: []   # Umami uses its own external DB (second Supabase project)
```

---

## Seed script

Create `backend/scripts/create_admin.py` — a standalone script (not a FastAPI route) that:
1. Reads `ADMIN_EMAIL` and `ADMIN_PASSWORD` from environment
2. Hashes the password with `passlib[bcrypt]`
3. Inserts a row into `admin_users` via `asyncpg`
4. Prints `"Admin created: {email}"` on success, `"Already exists"` if the email is taken

Run with: `python backend/scripts/create_admin.py`

---

## Definition of done

- [ ] Monorepo structure matches the layout above exactly
- [ ] `backend/migrations/001_initial.sql` is valid and idempotent (can be run twice without error — use `CREATE TABLE IF NOT EXISTS`)
- [ ] All API endpoints listed above are implemented and match their spec
- [ ] All constraints are enforced (security, reliability, code style, logging)
- [ ] All required test cases exist and pass (`pytest -v` exits 0)
- [ ] `backend/.env.example` documents every required variable
- [ ] `docker-compose.yml` is valid (`docker compose config` passes)
- [ ] `backend/scripts/create_admin.py` works standalone
- [ ] No secrets are hardcoded anywhere — all via environment variables
