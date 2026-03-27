# Backend Features — Lucas Janot Blog

## Current State

The site is a **static React + Vite + TypeScript** frontend. All content is hardcoded:
- Blog post metadata lives in `src/data/posts.ts` (no body content yet)
- Section texts (hero, narrative, experience, skills, research stats) are inline JSX strings
- No server, no database, no auth

---

## Goals

1. Edit page texts without touching code
2. Create and manage blog posts (with full rich-text body)
3. Track visits and user behavior

---

## Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| Language | Python 3.12+ | — |
| Framework | FastAPI | Async, automatic OpenAPI docs, Pydantic validation out of the box |
| Database | PostgreSQL via **Supabase** | Managed Postgres, free tier, built-in Storage and Row Level Security |
| DB client | `supabase-py` + `asyncpg` | `supabase-py` for Supabase-specific features (Storage, Auth); raw `asyncpg` for queries where needed |
| Data validation | Pydantic v2 | Native to FastAPI; models double as request/response schemas |
| Auth | `python-jose` + `passlib[bcrypt]` | JWT in `httpOnly` cookie; no third-party auth service |
| Media storage | Supabase Storage | S3-compatible buckets, already included in Supabase |
| Analytics | **Umami** (self-hosted) | Open source, MIT, one script tag, ready dashboard |
| Email | Resend Python SDK | Newsletter confirmation; 3k emails/month free |
| Server | Uvicorn + Gunicorn | Standard ASGI deployment |

### Project layout

```
backend/
├── app/
│   ├── main.py             # FastAPI app, CORS, router registration
│   ├── config.py           # Settings via pydantic-settings (.env)
│   ├── database.py         # Supabase client + asyncpg pool setup
│   ├── auth/
│   │   ├── router.py
│   │   ├── service.py
│   │   └── dependencies.py # get_current_admin dependency
│   ├── content/
│   │   ├── router.py
│   │   ├── service.py
│   │   └── schemas.py
│   ├── posts/
│   │   ├── router.py
│   │   ├── service.py
│   │   └── schemas.py
│   ├── newsletter/
│   │   ├── router.py
│   │   └── service.py
│   └── upload/
│       └── router.py
├── migrations/             # Raw SQL migration files
├── .env
├── requirements.txt
└── Dockerfile
```

The frontend stays as-is — you replace the hardcoded data with `fetch()` calls to the FastAPI endpoints.

---

## Feature 1 — Content Management (Page Texts)

### What needs to be editable

| Section | Fields |
|---|---|
| Hero | Headline, subheadline, status badge text, CTA button labels |
| Narrative | Body text (can be Markdown) |
| Research | Title, body, stats (label + value pairs) |
| Experience | Each entry: role, company, date range, description bullets |
| Skills | Each skill: name, category, icon/emoji |
| Contact | Social links: platform, URL, label |
| Navbar | Link labels and hrefs |
| Footer | Tagline text |

### Data model

```sql
-- Generic key-value store for simple text fields
content_blocks (
  id          uuid PRIMARY KEY,
  section     text NOT NULL,   -- e.g. "hero", "narrative"
  key         text NOT NULL,   -- e.g. "headline", "subheadline"
  value       text NOT NULL,
  updated_at  timestamptz DEFAULT now()
);

-- Structured entries for repeating sections
experience_entries (
  id          uuid PRIMARY KEY,
  role        text NOT NULL,
  company     text NOT NULL,
  period      text NOT NULL,       -- e.g. "Jan 2023 – Present"
  description text[] NOT NULL,     -- bullet points
  sort_order  int NOT NULL,
  updated_at  timestamptz DEFAULT now()
);

skills (
  id         uuid PRIMARY KEY,
  name       text NOT NULL,
  category   text NOT NULL,
  icon       text,
  sort_order int NOT NULL
);

social_links (
  id       uuid PRIMARY KEY,
  platform text NOT NULL,
  url      text NOT NULL,
  label    text NOT NULL,
  sort_order int NOT NULL
);
```

### API endpoints

```
GET  /api/content/:section         — fetch all keys for a section
GET  /api/experience               — fetch ordered list of experience entries
GET  /api/skills                   — fetch skills
GET  /api/social-links             — fetch social links

PATCH /api/content/:section/:key   — update a single text value [auth required]
PUT   /api/experience/:id          — update an experience entry [auth required]
POST  /api/experience              — create an experience entry [auth required]
DELETE /api/experience/:id         [auth required]
(same pattern for skills and social_links)
```

### Admin interface options

**Option A — Lightweight custom admin** (recommended for a personal blog)
- A password-protected route at `/admin` in the same React app
- Simple forms for each section
- One page per content area (e.g. `/admin/hero`, `/admin/experience`)
- No external dependency; total ownership

**Option B — FastAPI auto-generated admin** (alternative)
- Use `fastapi-admin` or `sqladmin` — both generate a full CRUD UI from your models automatically
- Zero frontend work; accessible at `/admin` on the FastAPI server
- Good option if you want to skip building the React admin pages

---

## Feature 2 — Blog Post Management

### What a post needs

```sql
posts (
  id           uuid PRIMARY KEY,
  slug         text UNIQUE NOT NULL,
  title        text NOT NULL,
  excerpt      text NOT NULL,
  body         text NOT NULL,          -- Markdown or HTML
  tag          text NOT NULL,          -- "System Entry" | "Research" | "Archived"
  status       text NOT NULL DEFAULT 'draft',  -- "draft" | "published"
  cover_image  text,                   -- URL or storage key
  read_time    text,                   -- auto-computed or manual
  published_at timestamptz,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);
```

### API endpoints

```
GET  /api/posts                  — list published posts (supports ?tag= filter)
GET  /api/posts/:slug            — get single post by slug
POST /api/posts                  — create post [auth required]
PUT  /api/posts/:slug            — update post [auth required]
DELETE /api/posts/:slug          [auth required]
PATCH /api/posts/:slug/publish   — toggle published/draft [auth required]
POST /api/upload                 — upload cover image [auth required]
```

### Frontend changes needed

- `src/data/posts.ts` → replaced by `GET /api/posts` fetch
- `PostCard` components get their data from the API response
- New page `src/pages/PostPage.tsx` at route `/blog/:slug` renders full post body
- Body can be rendered with `react-markdown` (+ `remark-gfm`)

### Admin interface for posts

- Post list with status badges (draft / published)
- Create / edit form:
  - Title, slug (auto-generated from title, editable)
  - Tag selector
  - Status toggle
  - Cover image upload (sent to `POST /api/upload`, stored in Supabase Storage)
  - Markdown editor (e.g. `@uiw/react-md-editor` — lightweight, no dependencies)
- Preview of rendered Markdown before publishing

### Slug auto-generation (backend utility)

FastAPI can generate the slug server-side on `POST /api/posts` if none is provided:

```python
import re

def slugify(title: str) -> str:
    slug = title.lower().strip()
    slug = re.sub(r"[^\w\s-]", "", slug)
    slug = re.sub(r"[\s_-]+", "-", slug)
    return re.sub(r"^-+|-+$", "", slug)
```

---

## Feature 3 — Analytics (Umami)

### What to track

| Event | Trigger | Data captured |
|---|---|---|
| Page view | Every route change | path, referrer, country, user-agent, timestamp |
| Post view | `/blog/:slug` opened | slug, time-on-page |
| CTA click | Hero buttons clicked | button label, path |
| Filter used | Blog tag filter clicked | tag selected |
| Scroll depth | On post pages | % scrolled (25 / 50 / 75 / 100) |

### Setup

Deploy **Umami** (open-source, MIT license) as a separate service alongside FastAPI. It has its own Postgres database (can be a second Supabase project or a separate schema).

**Deployment options:**
- Railway — one-click Umami template, free hobby tier
- Fly.io — free allowance, more control
- Docker Compose on a VPS alongside the FastAPI container

**Frontend integration — two lines:**

```html
<!-- index.html -->
<script defer src="https://your-umami.domain/script.js"
        data-website-id="YOUR_WEBSITE_ID"></script>
```

Page views are tracked automatically on every route change (Umami detects React SPA navigation via History API).

**Custom events** — use Umami's `umami.track()` JS API:

```ts
// CTA click example
<button onClick={() => umami.track('cta-click', { label: 'Explore Work' })}>
  Explore Work
</button>

// Filter used
umami.track('blog-filter', { tag: selectedTag })

// Scroll depth — fire once per threshold in a useEffect
umami.track('scroll-depth', { percent: 75, slug: post.slug })
```

No custom backend endpoints needed for analytics — Umami handles storage and the dashboard.

### Umami API (optional — surface stats in the site)

Umami exposes a REST API you can call from FastAPI if you want to display live stats (e.g. "X readers this month"):

```
GET /api/websites/:id/stats      — total views, visits, bounce rate
GET /api/websites/:id/pageviews  — time-series data
GET /api/websites/:id/events     — custom event breakdown
```

A FastAPI proxy route can forward these to the frontend without exposing your Umami credentials:

```
GET /api/analytics/stats   — proxied from Umami, cached 5 min [auth required]
```

---

## Feature 4 — Authentication (prerequisite for all admin features)

A single admin user (you). No registration flow needed.

```sql
admin_users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  created_at    timestamptz DEFAULT now()
);
```

```
POST /api/auth/login    — verifies credentials, sets httpOnly JWT cookie
POST /api/auth/logout   — clears cookie
GET  /api/auth/me       — validates session, returns user info
```

### FastAPI implementation notes

```python
# dependencies.py
from fastapi import Cookie, HTTPException, Depends
from jose import jwt, JWTError

async def get_current_admin(access_token: str = Cookie(None)):
    if not access_token:
        raise HTTPException(status_code=401)
    try:
        payload = jwt.decode(access_token, settings.secret_key, algorithms=["HS256"])
    except JWTError:
        raise HTTPException(status_code=401)
    return payload

# Any protected router
@router.post("/posts", dependencies=[Depends(get_current_admin)])
async def create_post(body: PostCreate): ...
```

- Passwords hashed with `passlib[bcrypt]`
- JWT signed with `python-jose`
- Token stored in `httpOnly; SameSite=Strict` cookie — never in `localStorage`
- Token expiry: 8 hours; no refresh token needed for a single-user admin

---

## Feature 5 — Newsletter Signup (already in the UI)

The BlogPage already has a newsletter form. Wire it up:

```sql
newsletter_subscribers (
  id         uuid PRIMARY KEY,
  email      text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);
```

```
POST /api/newsletter/subscribe    — add email, send confirmation (no auth)
GET  /api/newsletter/subscribers  — list subscribers [auth required]
```

Confirmation email sent via **Resend** Python SDK (free tier, 3k emails/month):

```python
import resend

resend.api_key = settings.resend_api_key

resend.Emails.send({
    "from": "lucas@yourdomain.com",
    "to": subscriber_email,
    "subject": "You're subscribed",
    "html": "<p>Thanks for subscribing!</p>",
})
```

---

## Implementation Order

| Phase | What | Unlocks |
|---|---|---|
| 1 | Supabase project + DB migrations + FastAPI scaffold | Foundation |
| 2 | Auth endpoints + `get_current_admin` dependency | Everything protected |
| 3 | Posts CRUD (`/api/posts`) + frontend fetch swap | Real posts with full body |
| 4 | Content blocks + experience/skills endpoints | Editable page texts |
| 5 | Deploy Umami + add `<script>` tag + custom events | Visitor data |
| 6 | File upload to Supabase Storage | Cover images |
| 7 | Newsletter endpoint + Resend email | Email list |

---

## Out of Scope (for now)

- Comments / reactions on posts
- Multi-user / roles
- RSS feed (easy to add later — just a GET endpoint)
- Search (can add Postgres full-text search on `posts` later)
