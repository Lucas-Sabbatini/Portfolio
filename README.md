# Blog — Full-Stack Monorepo

A personal blog and portfolio platform built with React + FastAPI.

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Framer Motion |
| Backend | FastAPI, Python 3.12, asyncpg, Pydantic v2 |
| Database | PostgreSQL |
| Storage | Local filesystem |
| Analytics | Umami |
| Email | Resend |
| Containerization | Docker / Docker Compose |

## Project Structure

```
blog/
├── frontend/         # React + Vite SPA
├── backend/          # FastAPI REST API
└── docker-compose.yml
```

## Running the Full Stack

The easiest way to run backend + analytics together is Docker Compose.

**Prerequisites**: Docker, Docker Compose, Node 18+

### 1. Configure environment

```bash
cp backend/.env.example backend/.env
# Fill in all required variables in backend/.env
```

### 2. Start backend + Umami

```bash
docker compose up
```

| Service | URL |
|---|---|
| Backend API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |
| Umami Analytics | http://localhost:3000 |

### 3. Start frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend runs at http://localhost:5173.

## Development (without Docker)

See the individual READMEs for full details:

- [frontend/README.md](./frontend/README.md)
- [backend/README.md](./backend/README.md)

## First-Time Setup

After starting the backend, create the admin user:

```bash
cd backend
python scripts/create_admin.py
```

Then log in at http://localhost:5173/admin.

## Linting

```bash
# Frontend (ESLint — zero warnings tolerance)
cd frontend && npm run lint

# Backend (Ruff — linter + formatter)
cd backend && ruff format --check .
cd backend && ruff format . 
cd backend && ruff check --fix .
```

> **Tip:** Install backend dev dependencies first with `pip install -r backend/requirements-dev.txt`.

## Running Tests

```bash
# Frontend
cd frontend && npx vitest run

# Backend
(.venv) cd backend && python -m pytest
```
