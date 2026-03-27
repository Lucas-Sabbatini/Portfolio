# Agent Prompt — Frontend Integration & Admin UI

## Prerequisites

This prompt must run **after** `AGENT_PROMPT.md` (the backend prompt). The monorepo has already been restructured: the frontend lives at `frontend/` and the FastAPI backend at `backend/`. All your work happens inside `frontend/`.

The FastAPI backend is running at `http://localhost:8000` in development. All API routes are prefixed with `/api`.

---

## Your task

1. Replace every hardcoded content array and string with live API data from the FastAPI backend
2. Add a full-post reading page (`/blog/:slug`)
3. Wire up the newsletter subscription form
4. Integrate Umami analytics (script tag + custom events)
5. Build a minimal admin UI at `/admin` for managing posts and page content

Do not change any Tailwind classes, animation variants, or visual styling on any existing component unless a change is strictly required to make that component work with live data. The site must look identical to its current state.

---

## New dependencies

Add to `frontend/package.json` and install:

```
react-markdown
remark-gfm
rehype-raw
@uiw/react-md-editor       ← admin only, markdown editor with preview
```

No other new dependencies. Do not install a state management library, form library, or UI component kit. Use React's built-in `useState`/`useEffect` and native HTML form elements.

---

## API client layer

Create `frontend/src/api/` with one file per domain. These are the only files allowed to call `fetch`. All API calls must set `credentials: 'include'` (for the JWT cookie).

### `frontend/src/api/client.ts`

Base fetch wrapper. On a non-2xx response, throw an `ApiError` with the status code and detail message from the response body.

```ts
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: 'Unknown error' }))
    throw new ApiError(res.status, body.detail ?? 'Unknown error')
  }
  return res.json()
}
```

### `frontend/src/api/posts.ts`

```ts
export interface Post {
  id: string
  slug: string
  title: string
  excerpt: string
  tag: 'System Entry' | 'Research' | 'Archived' | 'Drafting'
  status: 'draft' | 'published'
  cover_image?: string
  read_time?: string
  published_at?: string
  created_at: string
  updated_at: string
}

export interface PostDetail extends Post {
  body: string
}

export interface PostCreate {
  title: string
  excerpt: string
  body: string
  tag: Post['tag']
  slug?: string
  cover_image?: string
  read_time?: string
}

export const fetchPosts = (tag?: string) => ...      // GET /api/posts?tag=
export const fetchPost = (slug: string) => ...       // GET /api/posts/:slug
export const createPost = (data: PostCreate) => ...  // POST /api/posts
export const updatePost = (slug: string, data: Partial<PostCreate>) => ...  // PUT /api/posts/:slug
export const publishPost = (slug: string) => ...     // PATCH /api/posts/:slug/publish
export const deletePost = (slug: string) => ...      // DELETE /api/posts/:slug
export const uploadCoverImage = (file: File) => ...  // POST /api/upload (multipart)
```

For `uploadCoverImage`, do not set `Content-Type` manually — let the browser set the `multipart/form-data` boundary automatically.

### `frontend/src/api/content.ts`

```ts
export const fetchContent = (section: string) => ...     // GET /api/content/:section → Record<string, string>
export const patchContent = (section: string, key: string, value: string) => ...  // PATCH /api/content/:section/:key

export interface ExperienceEntry {
  id: string
  role: string
  company: string
  period: string
  description: string[]
  sort_order: number
}

export const fetchExperience = () => ...
export const createExperience = (data: Omit<ExperienceEntry, 'id'>) => ...
export const updateExperience = (id: string, data: Omit<ExperienceEntry, 'id'>) => ...
export const deleteExperience = (id: string) => ...

export interface Skill {
  id: string
  name: string
  category: string
  icon?: string
  sort_order: number
}

export const fetchSkills = () => ...
export const createSkill = (data: Omit<Skill, 'id'>) => ...
export const updateSkill = (id: string, data: Omit<Skill, 'id'>) => ...
export const deleteSkill = (id: string) => ...

export interface SocialLink {
  id: string
  platform: string
  url: string
  label: string
  sort_order: number
}

export const fetchSocialLinks = () => ...
export const createSocialLink = (data: Omit<SocialLink, 'id'>) => ...
export const updateSocialLink = (id: string, data: Omit<SocialLink, 'id'>) => ...
export const deleteSocialLink = (id: string) => ...
```

### `frontend/src/api/auth.ts`

```ts
export const login = (email: string, password: string) => ...  // POST /api/auth/login
export const logout = () => ...                                 // POST /api/auth/logout
export const getMe = () => ...                                  // GET /api/auth/me → { email: string }
```

### `frontend/src/api/newsletter.ts`

```ts
export const subscribe = (email: string) => ...  // POST /api/newsletter/subscribe
```

---

## Environment variable

Add to `frontend/.env.example`:

```
VITE_API_URL=http://localhost:8000
VITE_UMAMI_URL=https://your-umami-domain.com
VITE_UMAMI_WEBSITE_ID=
```

---

## Changes to existing files

### `frontend/src/data/posts.ts`

Delete `posts` array and the import of it everywhere. Keep and export only:
- The `PostTag` type
- The `tagColors` record

Update all files that imported `posts` from `../data/posts` to instead use `fetchPosts` from `../api/posts`.

### `frontend/src/App.tsx`

Add three new routes:

```tsx
<Route path="/blog/:slug" element={<PostPage />} />
<Route path="/admin/login" element={<AdminLoginPage />} />
<Route path="/admin/*" element={<AdminRoute />} />  {/* protected */}
```

`AdminRoute` is a wrapper component that calls `GET /api/auth/me` on mount. If the request returns 401, redirect to `/admin/login`. Otherwise render the admin layout with nested routes.

Apply `minimal={true}` to `<Navbar>` on all `/admin/*` paths (extend the existing minimal check in `Layout`).

### `frontend/src/pages/BlogPage.tsx`

Replace the static import of `posts` and `tagCounts` with:

```ts
const [posts, setPosts] = useState<Post[]>([])
const [loading, setLoading] = useState(true)

useEffect(() => {
  fetchPosts().then(setPosts).finally(() => setLoading(false))
}, [])

const tagCounts = posts.reduce<Record<string, number>>((acc, p) => {
  acc[p.tag] = (acc[p.tag] ?? 0) + 1
  return acc
}, {})
```

While `loading` is true, render a skeleton: three `glass-card rounded-[2rem] animate-pulse bg-white/5` placeholder divs in place of the post cards (same grid layout). Height of the featured placeholder: `h-[480px]`; grid cards: `h-[320px]`.

The signal count in the masthead (`{posts.length} Signals indexed`) becomes dynamic from the fetched array.

Wire up the newsletter form at the bottom. On submit:
- Disable the button and show `Transmitting…` text
- Call `subscribe(email)`
- On success: clear the input, show a success message `"Signal received."` below the form in `text-primary text-xs`
- On `ApiError` with status 409: show `"Already subscribed."` in `text-on-surface-variant text-xs`
- On other errors: show `"Something went wrong."` in `text-red-400 text-xs`
- Re-enable the button after any outcome

Post cards that navigate to a post should link to `/blog/${post.slug}`. Wrap the existing `motion.article` elements in a `<Link to={...}>` from `react-router-dom`. Do not change any visual styles.

### `frontend/src/components/BlogSection.tsx`

Replace the hardcoded `posts` array with:

```ts
const [posts, setPosts] = useState<Post[]>([])
useEffect(() => { fetchPosts().then(p => setPosts(p.slice(0, 3))) }, [])
```

While loading, render three skeleton `glass-card rounded-[3rem] aspect-[3/4] animate-pulse bg-white/5` placeholders.

Each card should navigate to `/blog/${post.slug}`. Replace `<motion.div>` with `<Link to={...}><motion.div>...</motion.div></Link>`.

Use `post.cover_image` for the image src. Fall back to the existing gradient logic if `cover_image` is null.

### `frontend/src/components/HeroSection.tsx`

Fetch `GET /api/content/hero` on mount. Map the following keys:

| API key | Current hardcoded value |
|---|---|
| `headline_line1` | `"Building"` |
| `headline_line2` | `"at scale"` |
| `status_badge` | `"Operational"` |
| `cta_primary` | `"Explore Works"` |
| `cta_secondary` | `"Research Lab"` |

While loading, replace text nodes with a `<span className="inline-block w-32 h-6 rounded bg-white/5 animate-pulse" />` inline skeleton. Do not change layout, animations, or class names. The headline structure `Building <br /> at scale` must stay split across two lines — render `headline_line1` and `headline_line2` separately.

Add Umami tracking to the two CTA buttons (see Analytics section below).

### `frontend/src/components/NarrativeSection.tsx`

Fetch `GET /api/content/narrative` on mount. Map keys:

| API key | Maps to |
|---|---|
| `section_label` | `"01 / Philosophy"` |
| `body` | The two-sentence paragraph text |

The stats grid (`2+`, `C2`, `3`, `608`) is intentionally **not** API-driven — it is personal branding data that rarely changes and is part of the site's visual identity. Leave it hardcoded.

### `frontend/src/components/ExperienceSection.tsx`

Replace the hardcoded `experiences` array with:

```ts
const [experiences, setExperiences] = useState<ExperienceEntry[]>([])
useEffect(() => { fetchExperience().then(setExperiences) }, [])
```

Map `ExperienceEntry` fields to the existing JSX:
- `entry.role` → `exp.title`
- `entry.company` → `exp.company`
- `entry.period` → `exp.period`
- `entry.description` → rendered as `<ul>` items (currently a single `exp.description` string — change the JSX to render an array, one `<li>` per bullet)
- Mark the first entry (lowest `sort_order`) as `active` (shows the `Active` badge and brighter dot)

The `Experience` interface in the component file is replaced by the imported `ExperienceEntry` type from the API.

### `frontend/src/components/ResearchSection.tsx`

Fetch `GET /api/content/research` on mount. Map keys:

| API key | Maps to |
|---|---|
| `title_line1` | `"AI Researcher"` |
| `title_line2` | `"@ AINet"` |
| `body` | The paragraph text |
| `stat_citations_value` | `"14+"` |
| `stat_citations_label` | `"Citations"` |
| `stat_pubs_value` | `"04"` |
| `stat_pubs_label` | `"Pubs"` |

While loading, show inline pulse skeletons for text nodes. Do not change layout.

### `frontend/src/components/SkillsSection.tsx`

Replace the hardcoded `skills` array with:

```ts
const [skills, setSkills] = useState<Skill[]>([])
useEffect(() => { fetchSkills().then(setSkills) }, [])
```

Use `skill.name` as the pill text. Keep all animations and classes identical.

### `frontend/src/components/ContactSection.tsx`

Replace the hardcoded `socialLinks` array with:

```ts
const [links, setLinks] = useState<SocialLink[]>([])
useEffect(() => { fetchSocialLinks().then(setLinks) }, [])
```

Use `link.url` for `href` and `link.label` for the button text.

### `frontend/src/components/Footer.tsx`

Replace the hardcoded `footerLinks` with the same `fetchSocialLinks()` call (the footer shows only 3 links — take the first 3 by `sort_order`). Use `link.url` and `link.label`.

---

## New files

### `frontend/src/pages/PostPage.tsx`

Route: `/blog/:slug`

```tsx
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
```

Behaviour:
1. On mount, call `fetchPost(slug)`. If the request throws `ApiError` with status 404, render a not-found state (see below).
2. While loading, show the loading skeleton.
3. On success, render the post.

**Loading skeleton** — mimics the page layout:
```
glass-card h-12 w-2/3 rounded-full animate-pulse    ← title placeholder
glass-card h-4 w-1/4 rounded-full animate-pulse     ← meta placeholder
glass-card w-full h-[400px] rounded-[2rem] animate-pulse   ← cover image
glass-card h-4 w-full rounded animate-pulse (×6 lines)     ← body
```

**Not-found state**:
```tsx
<div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
  <span className="material-symbols-outlined text-primary/30 text-6xl">signal_disconnected</span>
  <p className="text-on-surface-variant text-sm font-bold uppercase tracking-widest">
    Signal not found
  </p>
  <Link to="/blog" className="text-primary text-xs font-bold uppercase tracking-widest hover:underline">
    ← Back to Archive
  </Link>
</div>
```

**Post layout**:
```
<main className="min-h-screen pt-36 pb-24 px-6 md:px-12">
  <article className="max-w-3xl mx-auto space-y-12">
    {/* Header */}
    <header className="space-y-6">
      <Link to="/blog" className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest hover:text-primary transition-colors">
        ← Signal Archive
      </Link>
      <TagChip tag={post.tag} />
      <h1 className="font-headline font-extrabold text-4xl md:text-6xl tracking-tighter leading-tight text-on-surface">
        {post.title}
      </h1>
      <div className="flex items-center gap-4 text-on-surface-variant text-[10px] font-bold uppercase tracking-widest">
        <span>{formatted published_at date}</span>
        <span className="w-1 h-1 rounded-full bg-white/20" />
        <span>{post.read_time}</span>
      </div>
    </header>

    {/* Cover image */}
    {post.cover_image && (
      <div className="rounded-[2rem] overflow-hidden aspect-[16/7]">
        <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover opacity-80" />
      </div>
    )}

    {/* Body */}
    <div className="prose prose-invert prose-lg max-w-none
                    prose-headings:font-headline prose-headings:tracking-tight
                    prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                    prose-code:text-primary prose-code:bg-white/5 prose-code:rounded prose-code:px-1
                    prose-pre:glass-card prose-pre:rounded-[1rem]
                    prose-blockquote:border-primary prose-blockquote:text-on-surface-variant">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
        {post.body}
      </ReactMarkdown>
    </div>
  </article>
</main>
```

Import `TagChip` from `../components/blog/PostCard`.

Format `published_at` with:
```ts
new Date(post.published_at!).toLocaleDateString('en-US', { month: 'short', year: 'numeric', day: 'numeric' })
```

### `frontend/src/pages/admin/AdminLoginPage.tsx`

Route: `/admin/login`

A centered login form. If the user is already authenticated (`GET /api/auth/me` succeeds), redirect to `/admin/posts`.

```
<main className="min-h-screen flex items-center justify-center px-6">
  <div className="glass-card p-10 rounded-[2.5rem] w-full max-w-sm space-y-8">
    <h1 className="font-headline font-extrabold text-3xl tracking-tighter">Admin</h1>
    <form ...>
      <input type="email" placeholder="Email" ... />
      <input type="password" placeholder="Password" ... />
      <button type="submit">Enter</button>
    </form>
    {error && <p className="text-red-400 text-xs">{error}</p>}
  </div>
</main>
```

On submit: call `login(email, password)`. On success navigate to `/admin/posts`. On `ApiError` with status 401 show `"Invalid credentials"`.

Style inputs: `w-full bg-white/5 border border-white/10 rounded-full px-5 py-3 text-sm outline-none focus:border-primary/40 transition-colors`

Style button: `w-full bg-primary text-on-primary font-bold tracking-wider text-[10px] uppercase px-6 py-3 rounded-full`

### `frontend/src/pages/admin/AdminLayout.tsx`

Wraps all admin pages. Renders:
- A minimal fixed sidebar (desktop) / top bar (mobile) with:
  - Site logo `lucas.janot` linking to `/`
  - Nav items: Posts, Content, Experience, Skills, Social Links, Newsletter
  - Logout button at the bottom (calls `logout()`, navigates to `/admin/login`)
- `<Outlet />` for nested routes

Sidebar classes: `fixed left-0 top-0 h-screen w-56 glass-card border-r border-white/5 flex flex-col p-6 gap-2`

Nav item active state: `bg-primary/10 text-primary` — match current route with `useLocation`.

### `frontend/src/pages/admin/AdminPostsPage.tsx`

Route: `/admin/posts`

Fetches **all posts** (published + draft) by calling `GET /api/posts` twice — once without auth for published, and you must add a separate admin-only endpoint call...

Actually: the `GET /api/posts` endpoint returns only published posts. For the admin list, use the existing `GET /api/posts` endpoint but add `?status=all` query parameter to it — include a note in a code comment that the backend must support this parameter when authenticated. For now, fetch both `GET /api/posts` and show them; if the backend doesn't expose drafts yet, drafts will only be visible after publishing.

Layout:
```
<div className="space-y-8">
  <div className="flex items-center justify-between">
    <h1 className="font-headline font-extrabold text-3xl tracking-tighter">Posts</h1>
    <Link to="/admin/posts/new">
      <button className="bg-primary text-on-primary ...">New Post</button>
    </Link>
  </div>
  <div className="space-y-3">
    {posts.map(post => <PostRow key={post.id} post={post} onDelete={...} onPublish={...} />)}
  </div>
</div>
```

Each `PostRow` is a `glass-card rounded-[1.5rem] p-5 flex items-center gap-6`:
- Status badge: `published` → `text-primary bg-primary/10 border-primary/20`, `draft` → `text-on-surface-variant bg-white/5 border-white/10`
- Post title
- Date
- Actions: Edit (link to `/admin/posts/:slug/edit`), Publish/Unpublish toggle, Delete (with a confirm prompt via `window.confirm`)

### `frontend/src/pages/admin/AdminPostEditPage.tsx`

Route: `/admin/posts/new` and `/admin/posts/:slug/edit`

On `/new`: blank form. On `/edit`: fetch `GET /api/posts/:slug` and populate.

Form fields:
- `title` — text input
- `slug` — text input (auto-populated from title via `slugify`, editable)
- `tag` — `<select>` with options: System Entry, Research, Archived, Drafting
- `excerpt` — `<textarea>` (3 rows)
- `cover_image` — file input (`accept="image/jpeg,image/png,image/webp"`) + preview of current image if set. On file select, call `uploadCoverImage(file)` and store the returned URL in form state.
- `body` — `@uiw/react-md-editor` component

```tsx
import MDEditor from '@uiw/react-md-editor'
// ...
<MDEditor value={body} onChange={setBody} height={500} data-color-mode="dark" />
```

Save button: on click, calls `createPost` (new) or `updatePost` (edit). On success, navigate to `/admin/posts`.

Slugify helper (frontend copy of the backend function):
```ts
const slugify = (title: string) =>
  title.toLowerCase().trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
```

Auto-populate slug from title only when creating a new post (not on edit).

### `frontend/src/pages/admin/AdminContentPage.tsx`

Route: `/admin/content`

Fetches all content sections in parallel on mount:
```ts
const [hero, setHero] = useState<Record<string, string>>({})
const [narrative, setNarrative] = useState<Record<string, string>>({})
const [research, setResearch] = useState<Record<string, string>>({})

useEffect(() => {
  Promise.all([
    fetchContent('hero'),
    fetchContent('narrative'),
    fetchContent('research'),
  ]).then(([h, n, r]) => { setHero(h); setNarrative(n); setResearch(r) })
}, [])
```

Render one accordion-style section per content area. Each field is an inline-editable row:
- Text input with the current value
- A `Save` button that calls `patchContent(section, key, value)` and shows a brief `"Saved"` confirmation

Group the fields by section:

**Hero fields**: `headline_line1`, `headline_line2`, `status_badge`, `cta_primary`, `cta_secondary`

**Narrative fields**: `section_label`, `body`

**Research fields**: `title_line1`, `title_line2`, `body`, `stat_citations_value`, `stat_citations_label`, `stat_pubs_value`, `stat_pubs_label`

### `frontend/src/pages/admin/AdminExperiencePage.tsx`

Route: `/admin/experience`

List of experience entries with Add / Edit / Delete. Each entry shows an inline edit form when clicked. On save calls `updateExperience`. Delete uses `window.confirm`.

`description` field is a `<textarea>` where each line is one bullet point. On save, split by newline to produce `string[]`.

Add form at the bottom: blank inputs, calls `createExperience` on submit.

### `frontend/src/pages/admin/AdminSkillsPage.tsx`

Route: `/admin/skills`

Same pattern as experience. Fields: `name`, `category`, `icon` (emoji text input), `sort_order`.

### `frontend/src/pages/admin/AdminSocialLinksPage.tsx`

Route: `/admin/social-links`

Same pattern. Fields: `platform`, `url`, `label`, `sort_order`.

### `frontend/src/pages/admin/AdminNewsletterPage.tsx`

Route: `/admin/newsletter`

Fetches `GET /api/newsletter/subscribers` and renders a table:
- Email
- Subscribed date (formatted)
- Total count shown in header: `{subscribers.length} subscribers`

---

## Analytics — Umami

### `frontend/index.html`

Add to `<head>`:

```html
<script
  defer
  src="%VITE_UMAMI_URL%/script.js"
  data-website-id="%VITE_UMAMI_WEBSITE_ID%"
></script>
```

Vite does not replace `%VAR%` in HTML by default. Use the `vite-plugin-html` approach OR add this in `vite.config.ts`:

```ts
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  return {
    plugins: [react()],
    define: {
      '__UMAMI_URL__': JSON.stringify(env.VITE_UMAMI_URL ?? ''),
      '__UMAMI_WEBSITE_ID__': JSON.stringify(env.VITE_UMAMI_WEBSITE_ID ?? ''),
    },
  }
})
```

Alternatively, inject the script tag dynamically from `frontend/src/main.tsx` using the env variable:

```ts
if (import.meta.env.VITE_UMAMI_URL && import.meta.env.VITE_UMAMI_WEBSITE_ID) {
  const script = document.createElement('script')
  script.defer = true
  script.src = `${import.meta.env.VITE_UMAMI_URL}/script.js`
  script.dataset.websiteId = import.meta.env.VITE_UMAMI_WEBSITE_ID
  document.head.appendChild(script)
}
```

Use the `main.tsx` approach — it's simpler and avoids Vite HTML templating issues.

### Umami type declaration

Create `frontend/src/umami.d.ts`:

```ts
interface Window {
  umami?: {
    track: (event: string, props?: Record<string, unknown>) => void
  }
}
```

### `frontend/src/hooks/useAnalytics.ts`

A thin wrapper so components never call `window.umami` directly:

```ts
export function useAnalytics() {
  const track = (event: string, props?: Record<string, unknown>) => {
    window.umami?.track(event, props)
  }
  return { track }
}
```

### Custom event placements

Add `umami.track()` calls in the following places only. Do not add tracking anywhere else.

**`HeroSection.tsx`** — on the two CTA buttons:
```ts
const { track } = useAnalytics()
// primary button
onClick={() => track('cta-click', { label: content.cta_primary })}
// secondary button
onClick={() => track('cta-click', { label: content.cta_secondary })}
```

**`BlogPage.tsx`** — on filter change:
```ts
const handleFilterChange = (filter: Filter) => {
  setActiveFilter(filter)
  track('blog-filter', { tag: filter })
}
```

**`BlogPage.tsx`** — on newsletter subscribe success:
```ts
track('newsletter-subscribe')
```

**`PostPage.tsx`** — scroll depth on post pages. Fire each threshold once:
```ts
useEffect(() => {
  const thresholds = [25, 50, 75, 100]
  const fired = new Set<number>()

  const onScroll = () => {
    const scrolled = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
    thresholds.forEach(t => {
      if (scrolled >= t && !fired.has(t)) {
        fired.add(t)
        track('scroll-depth', { percent: t, slug: post?.slug })
      }
    })
  }

  window.addEventListener('scroll', onScroll, { passive: true })
  return () => window.removeEventListener('scroll', onScroll)
}, [post?.slug])
```

---

## Application constraints

### Data & loading states

- Every component that fetches data must handle three states: loading (skeleton), success (data), and error (silent — do not show error UI to public visitors; log to console only)
- Admin pages show an inline `text-red-400 text-sm` error message on fetch failure
- Never leave a component in a permanent loading state — always resolve to either data or a fallback after the fetch settles

### TypeScript

- Strict mode is already on. No `any`. No `// @ts-ignore`.
- All `fetch` calls go through `apiFetch` — never call `fetch` directly in a component
- All API response types must be defined in `src/api/` and imported from there — do not redefine them inline in components

### Routing

- All `/admin/*` routes must be protected by the `AdminRoute` wrapper (401 → redirect to `/admin/login`)
- The `Navbar` component must pass `minimal={true}` on all `/admin/*` and `/blog/:slug` paths
- The `Footer` must not render on `/admin/*` paths — add a check in `Layout`

### Styling

- Admin pages use the same `glass-card`, Tailwind tokens, and font as the main site
- Do not introduce new CSS classes — use only existing Tailwind utilities and the `.glass-card` class from `index.css`
- Admin inputs use the same style as the newsletter input: `bg-white/5 border border-white/10 rounded-full px-5 py-3 text-sm outline-none focus:border-primary/40 transition-colors`
- Admin primary actions use the same button style as the subscribe button: `bg-primary text-on-primary font-bold tracking-wider text-[10px] uppercase px-6 py-3 rounded-full`

### No breaking changes

- Public pages (`/`, `/blog`, `/blog/:slug`) must be fully functional even if the backend is unreachable — components should render their skeleton/fallback gracefully rather than crashing
- The `tagColors` record in `src/data/posts.ts` must remain exported as-is (it is used by `PostCard` and `PostPage`)

---

## Tests

Use **Vitest** + `@testing-library/react` + `msw` (Mock Service Worker) for request mocking.

Install:
```
vitest
@testing-library/react
@testing-library/user-event
@testing-library/jest-dom
msw
jsdom
```

Add to `frontend/vite.config.ts`:
```ts
test: {
  environment: 'jsdom',
  setupFiles: ['./src/test/setup.ts'],
  globals: true,
}
```

Create `frontend/src/test/setup.ts`:
```ts
import '@testing-library/jest-dom'
import { server } from './mocks/server'
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

Create `frontend/src/test/mocks/handlers.ts` with MSW handlers that return realistic fixture data for all API endpoints used in the tests.

### Required test cases

**`src/test/api/client.test.ts`**
- `throws ApiError on non-2xx response` — mock a 404, assert `ApiError` is thrown with correct status
- `returns parsed JSON on 2xx` — mock a 200, assert data is returned

**`src/test/pages/BlogPage.test.tsx`**
- `renders skeleton while loading` — assert skeleton elements present before API resolves
- `renders posts after loading` — assert post titles appear after API resolves
- `filters posts by tag` — click a filter button, assert only matching posts are visible
- `shows empty state when no posts match filter` — mock empty array, assert empty state message
- `subscribes to newsletter successfully` — fill email, submit, assert success message
- `shows duplicate error on 409` — mock 409, assert `"Already subscribed."` message

**`src/test/pages/PostPage.test.tsx`**
- `renders post content` — mock `GET /api/posts/test-slug`, assert title and excerpt render
- `renders 404 state for unknown slug` — mock 404, assert not-found message
- `renders markdown body` — mock post with `body: '# Hello'`, assert `<h1>Hello</h1>` in DOM

**`src/test/pages/admin/AdminLoginPage.test.tsx`**
- `renders login form`
- `shows error on invalid credentials` — mock 401, assert error message
- `navigates to /admin/posts on success` — mock 200, assert navigation

**`src/test/components/HeroSection.test.tsx`**
- `renders content from API` — mock `GET /api/content/hero`, assert headline values render
- `renders skeleton while loading`

Run tests with: `cd frontend && npx vitest run`

All tests must pass before the task is considered done.

---

## Definition of done

- [ ] `frontend/src/api/` contains all five files with full TypeScript types
- [ ] No component imports directly from `src/data/posts.ts` except for `tagColors` and `PostTag`
- [ ] All public page sections fetch live data and show loading skeletons
- [ ] `/blog/:slug` renders full post body as Markdown
- [ ] Newsletter form submits to the API and shows status feedback
- [ ] Umami script injected from `main.tsx`; `useAnalytics` hook used in HeroSection, BlogPage, PostPage
- [ ] `/admin/login` authenticates and redirects
- [ ] All admin routes protected — 401 redirects to `/admin/login`
- [ ] Admin can create, edit, publish/unpublish, and delete posts
- [ ] Admin can edit content blocks (hero, narrative, research)
- [ ] Admin can manage experience entries, skills, social links
- [ ] Admin can view newsletter subscribers
- [ ] Footer does not render on admin routes
- [ ] All required tests exist and pass (`npx vitest run` exits 0)
- [ ] No TypeScript errors (`npx tsc --noEmit` exits 0)
- [ ] The public site looks visually identical to its state before this task
