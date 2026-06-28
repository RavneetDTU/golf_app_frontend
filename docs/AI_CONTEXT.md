# AI_CONTEXT.md

> **READ THIS FIRST.** This is the mandatory orientation document for any AI agent working on this codebase. Read this file completely before touching any source file.

---

## Project

**App Name:** Golf Club Scorer — Frontend
**Club:** THE BAANIGANS

This is a Progressive Web App (PWA) for golf club members to submit and track their Stableford scores, view club leaderboards, and manage their golf profile. Members can enter hole-by-hole scores manually or scan a paper scorecard using GPT-4o Vision. Scores require admin or peer approval before appearing on the leaderboard. The app supports offline score entry via IndexedDB, syncing automatically when connectivity is restored.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 — App Router — JavaScript (not TypeScript) |
| Styling | Tailwind CSS v3 + Vanilla CSS tokens in `globals.css` |
| State | Zustand v5 (`store/useAuthStore.js`) |
| API Client | Axios (via `lib/api.js` — the only allowed API call file) |
| Forms | react-hook-form |
| Toasts | react-hot-toast |
| Icons | lucide-react |
| PWA | next-pwa v5 + IndexedDB (`idb` package) for offline support |
| Scorecard Scanning | GPT-4o Vision, called directly from the browser via `lib/scanner.js` (no backend proxy) |
| Deployment | Vercel — push to `main` branch triggers automatic redeploy |

---

## Hosting

| Resource | URL / Value |
|---|---|
| Deployed Frontend | https://golf-app-frontend.vercel.app |
| Backend API | https://golfappbackend.ayurvedapromise.com |
| Backend IP | 103.55.104.142 |
| Backend Port | 5030 (direct) / 443 (via Nginx HTTPS) |
| Env Var for API | `NEXT_PUBLIC_API_URL` |
| Deployment trigger | Push to `main` -> Vercel auto-rebuilds |

---

## Design Tokens

Defined in both `app/globals.css` (CSS custom properties) and `tailwind.config.js` (Tailwind color aliases):

| Token Name | Tailwind Class | Hex Value | Usage |
|---|---|---|---|
| Primary Green | `green-dark` | `#1B4332` | Primary buttons, headings, accents |
| Mid Green | `green-mid` | `#2D6A4F` | Hover states, secondary accents |
| Light Green | `green-light` | `#D8F3DC` | Backgrounds, icon containers |
| Background | `white` | `#FFFFFF` | Page background |
| Card Background | `off-white` | `#F8F9FA` | Card surfaces, stat blocks |
| Body Text | `black` | `#0A0A0A` | Primary text |
| Muted Text | `grey-mid` | `#6C757D` | Labels, subtitles, placeholders |
| Border | `grey-light` | `#E9ECEF` | Card borders, dividers |
| Error / Danger | `red-soft` | `#FF6B6B` | Error states, danger buttons |
| Gold (Rank #1) | `gold` | `#C9A84C` | Rank 1 badges — use sparingly |

**Fonts:** `Playfair Display` (`.font-display` class — headings) · `Inter` (body text — default)

---

## How To Read This Project

1. `docs/AI_CONTEXT.md` — this file (start here)
2. `docs/MODULE_STATUS.md` — certification status of every page, component, lib module, and store
3. `docs/API.md` — all API functions in `lib/api.js`, the Stableford calculator, IndexedDB schema, and env vars
4. `docs/TESTS.md` — test suite overview, how to run, what is and is not covered
5. `docs/COMMON_FAILURES.md` — documented bugs, gotchas, and known issues
6. Then source code, starting with `lib/api.js`

---

## Key Files — Read These First

| File | Purpose |
|---|---|
| `lib/api.js` | ALL backend API calls — every endpoint call lives here; never call fetch/axios directly from pages |
| `lib/auth.js` | Token and user profile storage helpers (localStorage) |
| `lib/stableford.js` | Client-side Stableford score calculator (`getStrokeAllowance`, `calculateHolePoints`, `calculateRoundPoints`) |
| `lib/offline.js` | IndexedDB offline cache helpers via `idb` package |
| `lib/scanner.js` | GPT-4o Vision scorecard scanner — calls OpenAI directly from the browser |
| `store/useAuthStore.js` | Global auth state (Zustand) — user, token, isLoading, login, logout, initialize, updateUser |
| `components/auth/ProtectedRoute.js` | Wraps all authenticated pages; redirects to `/login` if no token |
| `components/offline/OfflineSyncWrapper.js` | Listens to online/offline events; auto-syncs IndexedDB queue via POST /sync on reconnect |
| `components/layout/ClientLayout.js` | Root client layout — mounts Navbar, BottomNav, Toaster |
| `app/globals.css` | CSS custom properties (design tokens) and Google Fonts imports |
| `tailwind.config.js` | Tailwind color palette and font family config |
| `next.config.js` | next-pwa configuration (disabled in dev, enabled in production) |

---

## Key Architectural Decisions (Never Violate)

1. **GPT-4o Vision is called directly from the browser** — `lib/scanner.js` uses `dangerouslyAllowBrowser: true`. The backend is never involved in scorecard scanning.
2. **All backend API calls go through `lib/api.js`** — never call `fetch()` or `axios` directly from a page or component.
3. **Auth tokens are stored in localStorage** — `lib/auth.js` manages `golf_token` and `golf_user` keys. The Zustand store (`useAuthStore`) hydrates from localStorage on `initialize()`.
4. **Offline sync uses IndexedDB** — `lib/offline.js` stores pending scores in the `golf-offline` database, `pending-scores` object store. `OfflineSyncWrapper` auto-syncs on reconnect via `POST /sync`.
5. **Handicap is editable inline** — on `/scores/new` (Step 2 header) and on `/dashboard` (stats bar). Profile is silently updated via `PATCH /auth/me` on score submit when handicap differs from stored value.
6. **Admin panel is hidden from navigation** — accessible only via direct URL `/admin`. Non-admin users who navigate to `/admin` are silently redirected to `/dashboard`.
7. **Stableford points are calculated client-side** in `lib/stableford.js` and are also validated server-side. Client calculation drives the live running total UI on the scorecard entry page.
8. **PWA service worker is disabled in development** — `next.config.js` sets `disable: process.env.NODE_ENV === 'development'`.

---

## Backend Counterpart

- **Technology:** FastAPI (Python)
- **VPS:** 103.55.104.142
- **Public URL:** https://golfappbackend.ayurvedapromise.com (behind Nginx)
- **Auth:** Self-hosted JWT (not Supabase, not Firebase)
- **CORS:** `allow_credentials=False` — frontend uses Bearer token only, no cookies

---

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend base URL (e.g. `https://golfappbackend.ayurvedapromise.com`) |
| `NEXT_PUBLIC_OPENAI_API_KEY` | OpenAI key for GPT-4o Vision scorecard scanning |
| `NEXT_PUBLIC_APP_NAME` | App display name (used in metadata) |

See `.env.local.example` for the example values. **Never read or commit `.env.local`.**
