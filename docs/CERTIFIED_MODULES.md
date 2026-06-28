# CERTIFIED_MODULES.md

> Quick-reference registry of every certified, frozen module. Use this as a checklist before modifying any source file.

---

## What Certified Means

A certified module has:
- Passed all relevant tests at certification time
- Been approved by Ravneet
- Been recorded in `docs/PHASE_HISTORY.md`
- Had its behavior documented in `docs/API.md` or `docs/MODULE_STATUS.md`

### To Modify a Certified Module:
1. Document the reason in `docs/COMMON_FAILURES.md` (add a new CF-NNN entry)
2. Write a regression test in the Playwright suite (`golf_app_e2e_test/`)
3. Get explicit approval from Ravneet
4. Update this file with a change note after the modification is complete

---

## Certified Pages

| Page | Route | File | Certified In | Notes |
|---|---|---|---|---|
| Landing | `/` | `app/page.js` | Phase 1 | Auto-redirects authenticated users. Shows 3 feature cards. |
| Login | `/login` | `app/(auth)/login/page.js` | Phase 1 | react-hook-form. Eye toggle for password. Redirects if already logged in. |
| Register | `/register` | `app/(auth)/register/page.js` | Phase 1 | Accepts full_name, email, password, handicap (0–54, optional). |
| Dashboard | `/dashboard` | `app/dashboard/page.js` | Phase 1 + Handicap Patch | Inline handicap edit. Recent scores modal. Joined clubs with rank. |
| Clubs | `/clubs` | `app/clubs/page.js` | Phase 1 | Paginated. Local search. Optimistic join/leave. |
| Leaderboard | `/clubs/[clubId]/leaderboard` | `app/clubs/[clubId]/leaderboard/page.js` | Phase 1 | My rank banner. All-time points leaderboard. Paginated. |
| Add Score | `/scores/new` | `app/scores/new/page.js` | Phase 1 + Handicap Patch | 2-step wizard. Inline handicap. GPT-4o scan. Offline fallback. |
| Pending Approvals | `/pending-approvals` | `app/pending-approvals/page.js` | Phase 2 | Approve, reject, edit-and-resubmit peer scorecards. |
| Admin Panel | `/admin` | `app/admin/page.js` | Phase 2 | Direct URL only. is_admin guard. Users, Clubs, Disputes, Stats tabs. |

---

## Certified Lib Modules

| Module | File | Certified In | Notes |
|---|---|---|---|
| API Client | `lib/api.js` | Phase 1 | Single source for all backend HTTP calls. Request + response interceptors. |
| Auth Helpers | `lib/auth.js` | Phase 1 | localStorage: golf_token, golf_user keys. SSR-safe (typeof window checks). |
| Stableford Calculator | `lib/stableford.js` | Phase 1 | WHS-compliant. Three exported functions: getStrokeAllowance, calculateHolePoints, calculateRoundPoints. |
| Offline Cache | `lib/offline.js` | Phase 2 | IndexedDB via idb. DB: golf-offline. Store: pending-scores. 4 exported functions. |
| Scorecard Scanner | `lib/scanner.js` | Phase 2 | GPT-4o Vision. dangerouslyAllowBrowser: true. Returns parsed JSON hole data. |

---

## Certified Components

| Component | File | Certified In | Notes |
|---|---|---|---|
| ProtectedRoute | `components/auth/ProtectedRoute.js` | Phase 1 | Redirects to /login if no token. Shows skeleton during isLoading. |
| ClientLayout | `components/layout/ClientLayout.js` | Phase 1 | Mounts Navbar, BottomNav, react-hot-toast Toaster. |
| Navbar | `components/layout/Navbar.js` | Phase 1 | Top navigation bar. Admin tab NOT linked. |
| BottomNav | `components/layout/BottomNav.js` | Phase 1 | Mobile bottom navigation. Admin tab NOT linked. |
| PageWrapper | `components/layout/PageWrapper.js` | Phase 1 | Consistent page padding and max-width wrapper. |
| OfflineSyncWrapper | `components/offline/OfflineSyncWrapper.js` | Phase 2 | online/offline event listener. Auto-sync. Offline banner. |
| ScoreCard | `components/dashboard/ScoreCard.js` | Phase 1 | Recent score summary card on dashboard. |
| StatsBar | `components/dashboard/StatsBar.js` | Phase 1 | Aggregate stats display. |
| LeaderboardTable | `components/leaderboard/LeaderboardTable.js` | Phase 1 | Renders array of leaderboard entries. |
| LeaderboardRow | `components/leaderboard/LeaderboardRow.js` | Phase 1 | Single leaderboard entry row with rank styling. |
| HoleScoreInput | `components/scores/HoleScoreInput.js` | Phase 1 | Table row input for one hole (par, SI, shots, allowance, points display). Used on /scores/new and /pending-approvals. |
| ScanCard | `components/scores/ScanCard.js` | Phase 2 | Camera/file picker UI for GPT-4o scorecard scan. Calls lib/scanner.js. |
| ScanPreview | `components/scores/ScanPreview.js` | Phase 2 | Image preview component used by ScanCard. |
| PendingScoreCard | `components/pending/PendingScoreCard.js` | Phase 2 | Pending approval card UI with expand and action buttons. |
| PendingActions | `components/pending/PendingActions.js` | Phase 2 | Approve/Reject/Edit action button group for pending scores. |
| AdminStatsBar | `components/admin/AdminStatsBar.js` | Phase 2 | Admin stats tab display grid. |
| AdminUserRow | `components/admin/AdminUserRow.js` | Phase 2 | Single user row in admin Users tab with edit modal trigger. |
| AdminClubRow | `components/admin/AdminClubRow.js` | Phase 2 | Single club row in admin Clubs tab with edit modal trigger. |
| AdminDisputeRow | `components/admin/AdminDisputeRow.js` | Phase 2 | Single dispute row in admin Disputes tab with resolve modal trigger. |
| Badge | `components/ui/Badge.js` | Phase 1 | Variants: rank1 (gold), success (green), neutral (grey). |
| Button | `components/ui/Button.js` | Phase 1 | Variants: primary, secondary, outline, text, danger. Loading state with spinner. |
| Card | `components/ui/Card.js` | Phase 1 | Simple white rounded card with border. Accepts className. |
| EmptyState | `components/ui/EmptyState.js` | Phase 1 | Title, description, optional action button. Used for empty lists. |
| Input | `components/ui/Input.js` | Phase 1 | Label, type, error display. Forwards ref for react-hook-form compatibility. |
| Skeleton | `components/ui/Skeleton.js` | Phase 1 | Animated pulse placeholder. Variants: text, rect. |

---

## Certified Store

| Store | File | Certified In | Notes |
|---|---|---|---|
| Auth Store | `store/useAuthStore.js` | Phase 1 | State: user, token, isLoading. Actions: login, logout, initialize, updateUser. Hydrates from localStorage on initialize(). |

---

## Do Not Touch Without Approval

The following is a flat list of every certified file path for quick scanning. Any change to any of these files must follow the process described at the top of this document.

```
app/page.js
app/(auth)/login/page.js
app/(auth)/register/page.js
app/dashboard/page.js
app/clubs/page.js
app/clubs/[clubId]/leaderboard/page.js
app/scores/new/page.js
app/pending-approvals/page.js
app/admin/page.js
app/layout.js
app/globals.css
lib/api.js
lib/auth.js
lib/stableford.js
lib/offline.js
lib/scanner.js
store/useAuthStore.js
components/auth/ProtectedRoute.js
components/layout/ClientLayout.js
components/layout/Navbar.js
components/layout/BottomNav.js
components/layout/PageWrapper.js
components/offline/OfflineSyncWrapper.js
components/dashboard/ScoreCard.js
components/dashboard/StatsBar.js
components/leaderboard/LeaderboardTable.js
components/leaderboard/LeaderboardRow.js
components/scores/HoleScoreInput.js
components/scores/ScanCard.js
components/scores/ScanPreview.js
components/pending/PendingScoreCard.js
components/pending/PendingActions.js
components/admin/AdminStatsBar.js
components/admin/AdminUserRow.js
components/admin/AdminClubRow.js
components/admin/AdminDisputeRow.js
components/ui/Badge.js
components/ui/Button.js
components/ui/Card.js
components/ui/EmptyState.js
components/ui/Input.js
components/ui/Skeleton.js
tailwind.config.js
next.config.js
vercel.json
public/manifest.json
```
