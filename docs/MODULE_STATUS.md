# MODULE_STATUS.md

> Status registry for every certified page, component, lib module, store, and infrastructure feature. Updated at each certification event.

---

## Legend

| Symbol | Meaning |
|---|---|
| ✅ CERTIFIED | Frozen. Do not modify without explicit approval from Ravneet. |
| 🔄 IN PROGRESS | Currently being built. |
| ⏳ PENDING | Not started. |
| ⚠️ KNOWN ISSUE | Built but has a documented problem. See `docs/COMMON_FAILURES.md`. |

---

## Pages

| Page | Route | File | Status | Phase | Notes |
|---|---|---|---|---|---|
| Landing | `/` | `app/page.js` | ✅ CERTIFIED | Phase 1 | Auto-redirects authenticated users to `/dashboard`. Shows feature cards. |
| Login | `/login` | `app/(auth)/login/page.js` | ✅ CERTIFIED | Phase 1 | Uses react-hook-form. Redirects if already authenticated. |
| Register | `/register` | `app/(auth)/register/page.js` | ✅ CERTIFIED | Phase 1 | Accepts full_name, email, password, handicap (optional, 0–54). |
| Dashboard | `/dashboard` | `app/dashboard/page.js` | ✅ CERTIFIED | Phase 1 + Handicap Patch + Phase 3 | Shows joined clubs, rank, total points, rounds played, recent scores. Inline handicap edit. Score details modal. |
| Clubs | `/clubs` | `app/clubs/page.js` | ✅ CERTIFIED | Phase 1 | Paginated club list with local search. Join/Leave with optimistic UI. |
| Leaderboard | `/clubs/[clubId]/leaderboard` | `app/clubs/[clubId]/leaderboard/page.js` | ✅ CERTIFIED | Phase 1 | All-time club leaderboard. My rank banner. Paginated. |
| Add Score | `/scores/new` | `app/scores/new/page.js` | ✅ CERTIFIED | Phase 1 + Handicap Patch | 2-step wizard: game details then 18-hole scorecard. Inline handicap edit. GPT-4o scan integration. Offline fallback to IndexedDB. |
| Pending Approvals | `/pending-approvals` | `app/pending-approvals/page.js` | ✅ CERTIFIED | Phase 2 | Review, approve, reject, or edit-and-resubmit scorecards submitted by other players on your behalf. |
| Admin Panel | `/admin` | `app/admin/page.js` | ✅ CERTIFIED | Phase 2 + Phase 3 | Hidden from nav — direct URL only. Tabs: Users, Clubs, Disputes, Stats. Redirects non-admin users to `/dashboard`. |
| Admin Scores | `/admin/scores` | `app/admin/scores/page.js` | ✅ CERTIFIED | Phase 3 | Scores list with club filter, player search, deleted toggle, pagination. |
| Admin Add Score | `/admin/scores/add` | `app/admin/scores/add/page.js` | ✅ CERTIFIED | Phase 3 | Add score wizard: player select, game details, scorecard input, submit. |
| Admin Edit Score | `/admin/scores/[scoreId]/edit` | `app/admin/scores/[scoreId]/edit/page.js` | ✅ CERTIFIED | Phase 3 | Edit scorecard, adjust handicap, submit audit note, soft-delete score. |

---

## Components

| Component | File | Used By | Status |
|---|---|---|---|
| ProtectedRoute | `components/auth/ProtectedRoute.js` | All authenticated pages | ✅ CERTIFIED |
| ClientLayout | `components/layout/ClientLayout.js` | `app/layout.js` | ✅ CERTIFIED |
| Navbar | `components/layout/Navbar.js` | `ClientLayout` | ✅ CERTIFIED |
| BottomNav | `components/layout/BottomNav.js` | `ClientLayout` | ✅ CERTIFIED |
| PageWrapper | `components/layout/PageWrapper.js` | All pages | ✅ CERTIFIED |
| OfflineSyncWrapper | `components/offline/OfflineSyncWrapper.js` | `app/layout.js` | ✅ CERTIFIED |
| ScoreCard | `components/dashboard/ScoreCard.js` | Dashboard page | ✅ CERTIFIED |
| StatsBar | `components/dashboard/StatsBar.js` | Dashboard page | ✅ CERTIFIED |
| LeaderboardTable | `components/leaderboard/LeaderboardTable.js` | Leaderboard page | ✅ CERTIFIED |
| LeaderboardRow | `components/leaderboard/LeaderboardRow.js` | `LeaderboardTable` | ✅ CERTIFIED |
| HoleScoreInput | `components/scores/HoleScoreInput.js` | Add Score page, Pending Approvals page | ✅ CERTIFIED |
| ScanCard | `components/scores/ScanCard.js` | Add Score page (Step 2) | ✅ CERTIFIED |
| ScanPreview | `components/scores/ScanPreview.js` | `ScanCard` | ✅ CERTIFIED |
| PendingScoreCard | `components/pending/PendingScoreCard.js` | Pending Approvals page | ✅ CERTIFIED |
| PendingActions | `components/pending/PendingActions.js` | `PendingScoreCard` | ✅ CERTIFIED |
| AdminStatsBar | `components/admin/AdminStatsBar.js` | Admin page | ✅ CERTIFIED |
| AdminUserRow | `components/admin/AdminUserRow.js` | Admin page (Users tab) | ✅ CERTIFIED |
| AdminClubRow | `components/admin/AdminClubRow.js` | Admin page (Clubs tab) | ✅ CERTIFIED |
| AdminDisputeRow | `components/admin/AdminDisputeRow.js` | Admin page (Disputes tab) | ✅ CERTIFIED |
| Badge | `components/ui/Badge.js` | Multiple pages and components | ✅ CERTIFIED |
| Button | `components/ui/Button.js` | All pages and components | ✅ CERTIFIED |
| Card | `components/ui/Card.js` | All pages and components | ✅ CERTIFIED |
| EmptyState | `components/ui/EmptyState.js` | Dashboard, Clubs, Leaderboard, Scores pages | ✅ CERTIFIED |
| Input | `components/ui/Input.js` | Login, Register, Add Score, Admin pages | ✅ CERTIFIED |
| Skeleton | `components/ui/Skeleton.js` | All pages during loading states | ✅ CERTIFIED |

---

## Lib Modules

| Module | File | Purpose | Status |
|---|---|---|---|
| API Client | `lib/api.js` | All backend HTTP calls via Axios. Single source of truth for API interactions. | ✅ CERTIFIED |
| Auth Helpers | `lib/auth.js` | localStorage helpers: saveToken, getToken, removeToken, saveUser, getUser, removeUser | ✅ CERTIFIED |
| Stableford Calculator | `lib/stableford.js` | Client-side WHS Stableford calculation: getStrokeAllowance, calculateHolePoints, calculateRoundPoints | ✅ CERTIFIED |
| Offline Cache | `lib/offline.js` | IndexedDB helpers via `idb`: savePendingScore, getPendingScores, deletePendingScore, clearAllPending | ✅ CERTIFIED |
| Scorecard Scanner | `lib/scanner.js` | GPT-4o Vision wrapper: imageToBase64, scanScorecard. Calls OpenAI directly from browser. | ✅ CERTIFIED |
| Course Data | `lib/courseData.js` | Single source of truth for course hole parameters (Yellow tees) | ✅ CERTIFIED |


---

## Store

| Store | File | State Managed | Status |
|---|---|---|---|
| Auth Store | `store/useAuthStore.js` | user, token, isLoading; actions: login, logout, initialize, updateUser | ✅ CERTIFIED |

---

## Infrastructure

| Feature | Status | Notes |
|---|---|---|
| PWA Manifest | ✅ CERTIFIED | `public/manifest.json` — name: "Golf Club Scorer", theme: `#1B4332`, standalone display, portrait orientation |
| Service Worker | ✅ CERTIFIED | Generated by next-pwa into `public/sw.js`. Disabled in `NODE_ENV=development`. |
| IndexedDB Offline Cache | ✅ CERTIFIED | DB: `golf-offline`, Store: `pending-scores`, keyPath: `id` (autoIncrement). Auto-sync on reconnect via `OfflineSyncWrapper`. |
| Vercel Deployment | ✅ CERTIFIED | Framework: nextjs, buildCommand: `npm run build`, outputDirectory: `.next`. No `@secret` references. |
| Environment Variables | ✅ CERTIFIED | Set via Vercel dashboard Project Settings. See `docs/API.md` for full list. |

---

## Rules

- **Certified pages/components may only be modified for confirmed bugs** documented in `docs/COMMON_FAILURES.md` first.
- **New features get a new phase** — do not add to existing certified pages without Ravneet's explicit approval.
- **`lib/api.js` is the single API call file** — do not create parallel fetch utilities in pages or components.
- **All new components must follow the existing Tailwind token system** — never introduce ad-hoc hex colors or font sizes outside the config.
