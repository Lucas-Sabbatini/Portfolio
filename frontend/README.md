# Frontend

React + TypeScript SPA built with Vite and Tailwind CSS.

## Tech Stack

- **Framework**: React 18 + React Router 7
- **Language**: TypeScript (strict mode)
- **Build**: Vite 5
- **Styling**: Tailwind CSS 3 + custom utilities
- **Animation**: Framer Motion
- **Markdown**: react-markdown + remark-gfm
- **Testing**: Vitest + Testing Library + MSW

## Getting Started

```bash
cp .env.example .env
npm install
npm run dev
```

App runs at http://localhost:5173.

## Environment Variables

| Variable | Description | Required |
|---|---|---|
| `VITE_API_URL` | Backend base URL | Yes |
| `VITE_UMAMI_URL` | Umami instance URL | No |
| `VITE_UMAMI_WEBSITE_ID` | Umami website ID | No |

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build locally |
| `npx vitest run` | Run tests |
| `npx vitest` | Run tests in watch mode |
| `npx tsc --noEmit` | Type check without building |

## Project Structure

```
src/
├── api/              # API client layer
│   ├── client.ts     # Base fetch wrapper (apiFetch, ApiError)
│   ├── auth.ts       # Login, logout, getMe
│   ├── posts.ts      # Post CRUD + image upload
│   ├── content.ts    # Content blocks, experience, skills, social links
│   └── newsletter.ts # Newsletter subscription
├── components/       # Shared and section-specific components
│   └── blog/         # PostCard, BlogFilter
├── pages/            # Route-level components
│   └── admin/        # Protected admin pages
├── hooks/            # Custom React hooks
├── lib/              # Utilities (animations)
├── data/             # Static data (tag colors)
└── test/             # Vitest tests + MSW mocks
```

## Architecture

### API Layer

All API calls go through `apiFetch()` in `api/client.ts`. It:

- Sends `credentials: 'include'` on every request (JWT httpOnly cookie)
- Throws `ApiError` with a `status` code on non-OK responses
- Never exposes raw error messages from the server

Add new endpoints by creating a function in the relevant `api/*.ts` file using `apiFetch`.

### Authentication

Admin routes are wrapped in an `AdminRoute` component that calls `GET /api/auth/me`. On a 401 response it redirects to `/admin/login`. No token management is needed in the frontend — the backend sets/clears httpOnly cookies.

### Styling

- Tailwind utility classes everywhere
- Custom `glass-card` utility defined in `index.css`
- Custom color tokens (`primary`, `surface`, `error`, etc.) in `tailwind.config.ts`
- Font: Plus Jakarta Sans (loaded via `index.css`)

Do not use inline `style` props for layout. Use Tailwind classes.

### Loading States

Every component that fetches data must show a skeleton loader while loading. Use `animate-pulse` with placeholder `div`s that match the shape of the real content.

### Analytics

Umami is injected in `main.tsx`. Track custom events with:

```ts
import { useAnalytics } from '../hooks/useAnalytics';

const { track } = useAnalytics();
track('event-name', { optional: 'payload' });
```

## Testing Standards

- Test files live in `src/test/` mirroring the source structure
- API calls are mocked with MSW handlers in `src/test/mocks/handlers.ts`
- Use `render` + `screen` from Testing Library
- Do not mock modules — use MSW for network-level mocking
- Every new page and API module should have a corresponding test file

## Code Standards

- TypeScript strict mode — no `any`
- All components are function components with explicit return types
- State: `useState` + `useEffect` only — no Redux or Zustand
- Forms: native HTML inputs with React state — no form libraries
- No default exports from `api/` files
