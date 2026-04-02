# Backend

FastAPI REST API with PostgreSQL.

## Tech Stack

- **Framework**: FastAPI 0.109 (async)
- **Language**: Python 3.12
- **Database**: PostgreSQL — direct queries with `asyncpg`
- **Storage**: Local filesystem (uploaded files served as static files)
- **Auth**: JWT in httpOnly cookies (`python-jose`, `passlib[bcrypt]`)
- **Email**: Resend (newsletter confirmations)
- **Testing**: pytest + pytest-asyncio

## Getting Started

```bash
cp .env.example .env
# Fill in all required variables

pip install -r requirements.txt -r requirements-dev.txt

# Create the admin user (one-time)
python scripts/create_admin.py

# Start the dev server
uvicorn app.main:app --reload
```

API runs at http://localhost:8000. Interactive docs at http://localhost:8000/docs.

## Environment Variables

| Variable | Description | Required |
|---|---|---|
| `DATABASE_URL` | asyncpg connection string (`postgresql://user:pass@host/db`) | Yes |
| `SECRET_KEY` | 32-byte hex string for JWT signing | Yes |
| `ACCESS_TOKEN_EXPIRE_HOURS` | JWT TTL in hours (default: 8) | No |
| `ADMIN_EMAIL` | Admin user email for `create_admin.py` | Yes |
| `ADMIN_PASSWORD` | Admin user password for `create_admin.py` | Yes |
| `RESEND_API_KEY` | Resend API key for newsletter emails | Yes |
| `RESEND_FROM_EMAIL` | Sender email address | Yes |
| `UPLOAD_DIR` | Directory for uploaded images (default: `./uploads`) | No |
| `UMAMI_BASE_URL` | Umami instance URL (analytics proxy) | No |
| `UMAMI_API_KEY` | Umami API key | No |
| `UMAMI_WEBSITE_ID` | Umami website ID | No |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins | Yes |

## Running with Docker

```bash
# From the repo root
docker compose up backend
```

Or build the image standalone:

```bash
docker build -t blog-backend .
docker run --env-file .env -p 8000:8000 blog-backend
```

## Project Structure

```
backend/
├── app/
│   ├── main.py           # App factory, CORS, router registration
│   ├── config.py         # Settings loaded from .env via pydantic-settings
│   ├── database.py       # asyncpg pool singleton
│   ├── auth/             # JWT auth (router, service, dependencies)
│   ├── posts/            # Blog posts CRUD (router, service, schemas)
│   ├── content/          # CMS content blocks, experience, skills, social links
│   ├── newsletter/       # Subscriber management + Resend emails
│   └── upload/           # Multipart file upload to local filesystem
├── migrations/
│   └── 001_initial.sql   # Initial schema — run once against your Supabase DB
├── tests/                # pytest test suite
├── scripts/
│   └── create_admin.py   # Seeds the admin_users table
├── requirements.txt
├── requirements-dev.txt
└── Dockerfile
```

## API Overview

All routes are prefixed with `/api`.

| Module | Public endpoints | Protected endpoints |
|---|---|---|
| Auth | `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` | — |
| Posts | `GET /posts`, `GET /posts/{slug}` | `POST`, `PUT`, `DELETE`, `PATCH /{slug}/publish` |
| Content | `GET /content/{section}` | `PATCH /content/{section}/{key}` |
| Experience | `GET /experience` | `POST`, `PUT`, `DELETE` |
| Skills | `GET /skills` | `POST`, `PUT`, `DELETE` |
| Social Links | `GET /social-links` | `POST`, `PUT`, `DELETE` |
| Newsletter | `POST /newsletter/subscribe` | `GET /newsletter/subscribers` |
| Upload | — | `POST /upload` |
| Health | `GET /health` | — |

Protected endpoints require an active session cookie set by `POST /auth/login`.

## Database Migrations

Migrations are plain SQL files in `migrations/`. Run them manually against your database:

```bash
# Using psql
psql $DATABASE_URL -f migrations/001_initial.sql
```

New migrations should be named sequentially: `002_add_column.sql`, etc.

## Running Tests

```bash
pytest -v
```

Tests use `AsyncClient` with a mocked DB pool — no live database required.

```bash
# Run a specific file
pytest tests/test_posts.py -v

# Run with coverage
pytest --cov=app
```

## Architecture

### Module Structure

Each feature module (`posts`, `content`, etc.) contains:

- `router.py` — FastAPI route definitions, request/response types
- `service.py` — Business logic and database queries
- `schemas.py` — Pydantic models (request bodies, response shapes)

Routers import from services. Services import from `database.py`. Nothing else crosses module boundaries.

### Authentication

Login sets a `httpOnly`, `SameSite=Strict` cookie containing a signed JWT. The `get_current_admin` dependency in `auth/dependencies.py` validates the cookie on every protected route. There are no API keys — only session cookies.

### Database Access

All queries use asyncpg's parameterized query API. Never use string formatting or f-strings to build SQL. The connection pool is initialized on startup in `database.py` and accessed via `request.app.state.db`.

### Error Handling

- Always catch exceptions in service functions and re-raise as `HTTPException` with appropriate status codes
- Never expose raw exception messages in responses
- Log warnings for auth failures, errors for unexpected exceptions

## Code Standards

- All functions must have type annotations (parameters and return type)
- Pydantic models are the single source of truth for data shapes — no `dict` passing between layers
- No `any` types in Pydantic schemas; use `Optional[X]` explicitly
- Service functions should be `async` and accept a `db` connection or pool as a parameter
- One router per module — do not add routes to `main.py`
