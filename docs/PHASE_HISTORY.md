# PHASE_HISTORY.md

> Chronological audit trail of every certified phase. Each phase entry is immutable once certified. New work is recorded in a new phase entry.

---

## Phase 1 — Core Pages + API Client + Stableford Calculator

**Status:** ✅ CERTIFIED
**Certified By:** Ravneet
**Date:** [UNKNOWN — infer from code review]

**Scope — What Was Built:**

- Landing page (`/`) with feature cards (Leaderboard, Scores, Scan Card Coming Soon)
- Login page (`/login`) with email/password form, react-hook-form validation, password visibility toggle
- Register page (`/register`) with full_name, email, password, optional handicap (0–54)
- Dashboard page (`/dashboard`) with joined clubs, rank per club, total points, rounds played, recent scores (paginated), score details modal
- Clubs page (`/clubs`) with paginated club list, local search, join/leave with optimistic UI updates
- Leaderboard page (`/clubs/[clubId]/leaderboard`) with all-time club leaderboard, "Your rank" banner, paginated load more
- Add Score page (`/scores/new`) with 2-step wizard: game details (club, date, course name, tee colour, notes) then 18-hole scorecard entry
- `lib/api.js` — Axios instance with request interceptor (Bearer token) and response interceptor (global error handling). All backend API functions.
- `lib/auth.js` — localStorage helpers for token and user profile
- `lib/stableford.js` — Client-side WHS Stableford calculator: `getStrokeAllowance`, `calculateHolePoints`, `calculateRoundPoints`
- `store/useAuthStore.js` — Zustand auth store: user, token, isLoading, login, logout, initialize, updateUser
- `components/auth/ProtectedRoute.js` — redirect guard for authenticated pages
- `components/layout/ClientLayout.js`, `Navbar.js`, `BottomNav.js`, `PageWrapper.js`
- `components/ui/` — Badge, Button, Card, EmptyState, Input, Skeleton
- `components/dashboard/` — ScoreCard, StatsBar
- `components/leaderboard/` — LeaderboardTable, LeaderboardRow
- `components/scores/HoleScoreInput.js`
- Tailwind design tokens (green-dark, green-mid, green-light, off-white, grey-light, grey-mid, red-soft, gold)
- Google Fonts: Playfair Display + Inter

**Pages/Components Certified:**
- `app/page.js`
- `app/(auth)/login/page.js`
- `app/(auth)/register/page.js`
- `app/dashboard/page.js`
- `app/clubs/page.js`
- `app/clubs/[clubId]/leaderboard/page.js`
- `app/scores/new/page.js`
- `lib/api.js`
- `lib/auth.js`
- `lib/stableford.js`
- `store/useAuthStore.js`
- All `components/` listed above

**Certificate Notes:**
- JavaScript (not TypeScript) — deliberate project decision. TypeScript is not to be introduced.
- Zustand v5 API used (no deprecated `immer` middleware).
- Stableford calculator validated against WHS (World Handicap System) specification: stroke allowance distributes remainder strokes to lowest SI holes first.
- The `app/(auth)/` route group is used for login and register but adds no layout of its own (no `layout.js` in the group).
- 409 (duplicate score) errors are surfaced to the user via toast by the global response interceptor.

**Next Phase Triggered:** Phase 2 — Pending Approvals + Admin Panel + PWA + Vercel Deployment

---

## Phase 2 — Pending Approvals + Admin Panel + PWA + Vercel Deployment

**Status:** ✅ CERTIFIED
**Certified By:** Ravneet
**Date:** [UNKNOWN — infer from code review]

**Scope — What Was Built:**

- Pending Approvals page (`/pending-approvals`) — list of scorecards submitted by other players on your behalf. Actions: approve, reject, edit-and-resubmit with live Stableford recalculation.
- Admin Panel page (`/admin`) — hidden from navigation, direct URL only. Tabs: Users (paginated, searchable), Clubs (paginated), Disputes (filterable by status), Stats. Non-admin redirected to `/dashboard` silently.
- GPT-4o Vision scorecard scanning — `lib/scanner.js` + `components/scores/ScanCard.js` + `components/scores/ScanPreview.js`. Calls OpenAI directly from browser. Prefills hole scores on scan completion.
- PWA infrastructure — `next-pwa` v5 configured in `next.config.js`. Service worker generated to `public/sw.js`. Manifest at `public/manifest.json`. Disabled in development mode.
- IndexedDB offline cache — `lib/offline.js` using `idb` package. Stores pending scores when offline.
- `components/offline/OfflineSyncWrapper.js` — wraps all pages, listens to online/offline events, auto-syncs IndexedDB queue to `POST /sync` on reconnect, shows persistent offline banner.
- `components/pending/PendingScoreCard.js`, `PendingActions.js`
- `components/admin/AdminStatsBar.js`, `AdminUserRow.js`, `AdminClubRow.js`, `AdminDisputeRow.js`
- Vercel deployment configuration — `vercel.json` cleaned of all `@secret` references. All env vars set via Vercel dashboard.
- `.env.local.example` created for developer onboarding.

**Pages/Components Certified:**
- `app/pending-approvals/page.js`
- `app/admin/page.js`
- `lib/scanner.js`
- `lib/offline.js`
- `components/offline/OfflineSyncWrapper.js`
- `components/scores/ScanCard.js`
- `components/scores/ScanPreview.js`
- `components/pending/PendingScoreCard.js`
- `components/pending/PendingActions.js`
- `components/admin/AdminStatsBar.js`
- `components/admin/AdminUserRow.js`
- `components/admin/AdminClubRow.js`
- `components/admin/AdminDisputeRow.js`
- `public/manifest.json`
- `next.config.js` (PWA config)
- `vercel.json` (cleaned)

**Certificate Notes:**
- Admin panel deliberately not linked in Navbar or BottomNav — accessible only at `/admin` by direct URL. This is an intentional security-by-obscurity + `is_admin` check design.
- GPT-4o Vision key (`NEXT_PUBLIC_OPENAI_API_KEY`) is exposed client-side — accepted risk for this project. In production, consider a backend proxy to protect the key.
- Offline sync uses a last-write-wins approach. No conflict resolution is implemented.
- The `syncOfflineScores` endpoint (`POST /sync`) requires the backend to accept a batch of pending scores. See CF-005 for known limitations.

**Next Phase Triggered:** Handicap UX Patch

---

## Handicap UX Patch — Inline Handicap Edit

**Status:** ✅ CERTIFIED
**Certified By:** Ravneet
**Date:** [UNKNOWN — infer from code review]

**Scope — What Was Built:**

- **Dashboard handicap edit** (`app/dashboard/page.js`): Added pencil/cancel/save toggle in the Handicap stat card. Validates 0–54 range. Calls `updateProfile({ handicap })` and updates Zustand store on save.
- **Add Score handicap edit** (`app/scores/new/page.js`, Step 2 header): Added pencil/checkmark inline edit inline with the "Handicap:" label row. Validated same 0–54 range. Handicap value drives live Stableford calculation immediately on confirm.
- **Silent profile update on score submit** (`app/scores/new/page.js`): After a successful score submission, `updateProfile` is called silently with the final handicap value. Failure does not block the success toast.

**Pages/Components Certified:**
- `app/dashboard/page.js` (modified)
- `app/scores/new/page.js` (modified)

**Certificate Notes:**
- Handicap changes made on `/scores/new` are not persisted until score submit. If the user navigates away mid-session, the changed handicap is lost (not auto-saved to localStorage or profile).
- The `handicapValue` state in `/scores/new` is separate from `user.handicap` in the store — this is intentional to allow session-local overrides without polluting the global store until commit.

**Next Phase Triggered:** None — no phase currently in progress.

---

## Par & SI Data Correction Patch

**Status:** ✅ CERTIFIED
**Certified By:** Ravneet
**Date:** 28 June 2026

**Scope — What Was Built:**
- Created `lib/courseData.js` — single source of truth for THE BAANIGANS course hole data
- Fixed all 18 holes: correct Par values, correct SI values 1–18
- Made Par and SI columns read-only (plain text) on scorecard entry page
- Stableford calculation now reads from COURSE_HOLES, not mutable input state

**Files Modified/Created:**
- `lib/courseData.js` (new)
- `app/scores/new/page.js` (updated)
- `components/scores/HoleScoreInput.js` (updated)
- `docs/MODULE_STATUS.md` (updated)
- `docs/COMMON_FAILURES.md` (CF-009 added)
- `docs/PHASE_HISTORY.md` (this entry)

**Correct Course Data (Yellow Tees):**
Front 9: H1(P4,SI5) H2(P4,SI9) H3(P3,SI11) H4(P5,SI17) H5(P4,SI7)
         H6(P3,SI13) H7(P4,SI1) H8(P5,SI15) H9(P4,SI3) — Par 36
Back 9:  H10(P4,SI6) H11(P3,SI18) H12(P5,SI16) H13(P4,SI4) H14(P4,SI12)
         H15(P4,SI2) H16(P3,SI10) H17(P4,SI8) H18(P5,SI14) — Par 36
Total Par: 72

**Note:** Existing submitted scores are NOT retroactively recalculated.
Only new scores submitted after this patch will use the correct values.

**Next Phase Triggered:** Frontend Phase 3 — Admin Score Management UI

---

## Frontend Phase 3 — Admin Score Management UI

**Status:** ✅ CERTIFIED
**Certified By:** Ravneet
**Date:** 28 June 2026

**Scope — What Was Built:**
- /admin/scores — scores list with club filter, player search, deleted toggle, pagination
- /admin/scores/add — 3-step wizard: player+game details → scorecard → submit
- /admin/scores/[scoreId]/edit — full scorecard edit with mandatory audit note + delete
- /admin/page.js — Scores tab/link added
- /dashboard/page.js — "✏️ Edited by admin" chip + audit note modal on edited scores
- lib/api.js — 4 new admin score API functions added

**Pages/Components Certified:**
- app/admin/scores/page.js
- app/admin/scores/add/page.js
- app/admin/scores/[scoreId]/edit/page.js
- app/admin/page.js (modified)
- app/dashboard/page.js (modified)
- lib/api.js (modified — 4 new functions)

**Certificate Notes:**
- Par and SI on admin scorecard entry reuse COURSE_HOLES from lib/courseData.js (read-only)
- Option C game auto-detection handled entirely on backend — frontend sends player+club+date only
- Soft-delete is reversible via direct DB query but no UI restore feature in this phase
- Audit note visibility on dashboard depends on score history API returning admin_edit_note field

**Next Phase Triggered:** None — pending next feature discussion.


