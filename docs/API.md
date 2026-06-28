# API.md

> This documents how the **frontend** communicates with the backend. It is NOT the backend's own API docs — it documents the frontend's perspective: what it calls, what it expects back, and any frontend-specific handling.

---

## Backend Base URL

```
NEXT_PUBLIC_API_URL=https://golfappbackend.ayurvedapromise.com
```

All calls go through `lib/api.js`. **Never hardcode the base URL elsewhere.**

The axios instance falls back to `http://103.55.104.142:5030` if the env var is not set (development only).

---

## Auth Header

```
Authorization: Bearer <token>
```

Token is retrieved via `lib/auth.js → getToken()`. The axios instance in `lib/api.js` attaches it via a request interceptor on every outbound request.

---

## Global Error Handling (Response Interceptor)

The axios instance in `lib/api.js` handles errors globally before they reach the calling page:

| HTTP Status | Frontend Behavior |
|---|---|
| Network error (no response) | `toast.error('Connection failed. Check your internet.')` |
| 401 (not on /auth/login or /auth/register) | `toast.error('Session expired...')` + `useAuthStore.logout()` (redirects to `/`) |
| 403 | `toast.error("You don't have permission to do that.")` |
| 409 | `toast.error(data.message \|\| 'A conflict occurred.')` |
| 422 | Silent — handled by form UI (field-level validation errors) |
| 500+ | `toast.error('Something went wrong. Please try again.')` |

---

## API Functions in lib/api.js

### registerUser(data)

**HTTP:** `POST /auth/register`
**Auth:** No
**Params:** `{ full_name: string, email: string, password: string, handicap: number }`
**Returns:** `{ user: { id, full_name, email, handicap, is_admin, ... }, access_token: string }`
**Called From:** `app/(auth)/register/page.js`
**Error Handling:** Page catches error, shows `toast.error` with `error.response?.data?.message`

---

### loginUser(data)

**HTTP:** `POST /auth/login`
**Auth:** No
**Params:** `{ email: string, password: string }`
**Returns:** `{ user: { id, full_name, email, handicap, is_admin, ... }, access_token: string }`
**Called From:** `app/(auth)/login/page.js`
**Error Handling:** Page catches error, shows `toast.error` with `error.response?.data?.message || 'Invalid email or password.'`

---

### getMe()

**HTTP:** `GET /auth/me`
**Auth:** Yes
**Params:** None
**Returns:** `{ id, full_name, email, handicap, is_admin, is_active, ... }`
**Called From:** [UNKNOWN — not found in any page; available for future use]
**Error Handling:** Global interceptor handles 401

---

### updateProfile(data)

**HTTP:** `PATCH /auth/me`
**Auth:** Yes
**Params:** `{ handicap: number }` (partial update — only changed fields needed)
**Returns:** Updated user object `{ id, full_name, email, handicap, ... }`
**Called From:** `app/dashboard/page.js` (inline handicap edit), `app/scores/new/page.js` (silent update on score submit)
**Error Handling:** Caller catches error. On `/scores/new`, a failure shows `toast.error` but does not block score submission.

---

### getClubs(page)

**HTTP:** `GET /clubs?page=<page>&per_page=10`
**Auth:** Yes
**Params:** `page: number` (default: 1)
**Returns:** `{ clubs: [{ id, name, location, description, member_count, is_member }], total: number, has_more: boolean }`
**Called From:** `app/clubs/page.js`, `app/dashboard/page.js`, `app/scores/new/page.js`
**Error Handling:** Page logs error to console; UI shows empty state or skeleton.

---

### getClub(clubId)

**HTTP:** `GET /clubs/:clubId`
**Auth:** Yes
**Params:** `clubId: string | number`
**Returns:** `{ id, name, location, description, member_count, is_member }`
**Called From:** `app/clubs/[clubId]/leaderboard/page.js` (to get club name)
**Error Handling:** Global interceptor; leaderboard falls back to club name from leaderboard response.

---

### createClub(data)

**HTTP:** `POST /clubs`
**Auth:** Yes
**Params:** `{ name: string, description?: string, location?: string }`
**Returns:** `{ id, name, ... }`
**Called From:** [UNKNOWN — function exists in `lib/api.js` but no page currently calls it in the frontend; may be admin-only or future feature]
**Error Handling:** Global interceptor

---

### joinClub(clubId)

**HTTP:** `POST /clubs/:clubId/join`
**Auth:** Yes
**Params:** `clubId: string | number`
**Returns:** Success message or updated club object
**Called From:** `app/clubs/page.js`
**Error Handling:** Optimistic UI — page rolls back on error, shows `toast.error(error.response?.data?.detail)`

---

### leaveClub(clubId)

**HTTP:** `DELETE /clubs/:clubId/leave`
**Auth:** Yes
**Params:** `clubId: string | number`
**Returns:** Success message
**Called From:** `app/clubs/page.js`
**Error Handling:** Optimistic UI — page rolls back on error, shows `toast.error(error.response?.data?.detail)`

---

### createGame(data)

**HTTP:** `POST /games`
**Auth:** Yes
**Params:** `{ club_id: string|number, played_on: string (ISO date), course_name?: string, tee_colour?: string, notes?: string }`
**Returns:** `{ id: number, ... }` — game ID used immediately in `submitScore`
**Called From:** `app/scores/new/page.js` (Step A of 3-step submission)
**Error Handling:** Page catches error; falls back to IndexedDB if network error (`!err.response`)

---

### submitScore(gameId, data)

**HTTP:** `POST /games/:gameId/scores`
**Auth:** Yes
**Params:** `gameId: number`, `{ hole_scores: [{ hole, par, stroke_index, shots }], handicap_override: number }`
**Returns:** `{ id, stableford_points, gross_shots, handicap_used, hole_scores: [...] }`
**Called From:** `app/scores/new/page.js` (Step B of submission, immediately after `createGame`)
**Error Handling:** Page catches error; falls back to IndexedDB if network error

---

### getGameScores(gameId)

**HTTP:** `GET /games/:gameId/scores`
**Auth:** Yes
**Params:** `gameId: number`
**Returns:** Score detail object with hole-by-hole breakdown
**Called From:** [UNKNOWN — function exists in `lib/api.js` but not called from any current page]
**Error Handling:** Global interceptor

---

### getMyScores(page)

**HTTP:** `GET /scores/my?page=<page>&per_page=10`
**Auth:** Yes
**Params:** `page: number` (default: 1)
**Returns:** `{ scores: [{ id, game_id, club_name, played_on, course_name, tee_colour, stableford_points, gross_shots, handicap_used, hole_scores }], has_more: boolean }`
**Called From:** `app/dashboard/page.js`
**Error Handling:** Page logs error; empty scores array shown

---

### getLeaderboard(clubId, page)

**HTTP:** `GET /clubs/:clubId/leaderboard?page=<page>&per_page=10`
**Auth:** Yes
**Params:** `clubId: string|number`, `page: number` (default: 1)
**Returns:** `{ entries: [{ rank, user_id, user_name, total_stableford_points, rounds_played }], club_name: string, has_more: boolean }`
**Called From:** `app/clubs/[clubId]/leaderboard/page.js`
**Error Handling:** Page logs error; empty state shown

---

### getMyRank(clubId)

**HTTP:** `GET /clubs/:clubId/leaderboard/me`
**Auth:** Yes
**Params:** `clubId: string|number`
**Returns:** `{ rank: number, total_stableford_points: number, rounds_played: number }`
**Called From:** `app/clubs/[clubId]/leaderboard/page.js`, `app/dashboard/page.js`
**Error Handling:** 404 means user has no score in this club yet — treated as "unranked" (not shown as error)

---

### getMyPendingScores()

**HTTP:** `GET /pending-scores/mine`
**Auth:** Yes
**Params:** None
**Returns:** Array of pending score objects: `[{ id, submitted_by_name, club_name, played_on, course_name, hole_scores, ... }]`
**Called From:** `app/pending-approvals/page.js`
**Error Handling:** Page shows `toast.error('Failed to load pending approvals.')`

---

### approvePendingScore(id)

**HTTP:** `POST /pending-scores/:id/approve`
**Auth:** Yes
**Params:** `id: number`
**Returns:** Success response
**Called From:** `app/pending-approvals/page.js`
**Error Handling:** Page shows `toast.error(error.response?.data?.detail)`

---

### rejectPendingScore(id)

**HTTP:** `POST /pending-scores/:id/reject`
**Auth:** Yes
**Params:** `id: number`
**Returns:** Success response
**Called From:** `app/pending-approvals/page.js`
**Error Handling:** Page shows `toast.error(error.response?.data?.detail)`

---

### editAndSubmitPending(id, data)

**HTTP:** `POST /pending-scores/:id/edit-and-submit`
**Auth:** Yes
**Params:** `id: number`, `{ hole_scores: [{ hole, par, stroke_index, shots }] }`
**Returns:** Success response
**Called From:** `app/pending-approvals/page.js`
**Error Handling:** Page shows `toast.error(error.response?.data?.detail)`

---

### raiseDispute(scoreId, data)

**HTTP:** `POST /scores/:scoreId/dispute`
**Auth:** Yes
**Params:** `scoreId: number`, `{ reason: string }`
**Returns:** Dispute object
**Called From:** [UNKNOWN — function exists in `lib/api.js`; dispute UI may be in leaderboard row component]
**Error Handling:** Global interceptor

---

### getMyDisputes()

**HTTP:** `GET /disputes/mine`
**Auth:** Yes
**Params:** None
**Returns:** Array of dispute objects
**Called From:** [UNKNOWN — function exists; `/disputes` page may exist but was not found in `app/`]
**Error Handling:** Global interceptor

---

### adminGetUsers(page, search)

**HTTP:** `GET /admin/users?page=<page>&per_page=20&search=<search>`
**Auth:** Yes (admin only)
**Params:** `page: number` (default: 1), `search: string` (default: `''`)
**Returns:** `{ users: [...], has_more: boolean }`
**Called From:** `app/admin/page.js` (Users tab)
**Error Handling:** Global interceptor (403 for non-admin)

---

### adminUpdateUser(userId, data)

**HTTP:** `PATCH /admin/users/:userId`
**Auth:** Yes (admin only)
**Params:** `userId: number`, `{ full_name?, handicap?, is_active?, is_admin? }`
**Returns:** Updated user object
**Called From:** `app/admin/page.js` (Users tab edit modal)
**Error Handling:** Global interceptor; page shows `toast.error` on failure

---

### adminGetClubs(page)

**HTTP:** `GET /admin/clubs?page=<page>&per_page=20`
**Auth:** Yes (admin only)
**Params:** `page: number` (default: 1)
**Returns:** `{ clubs: [...], has_more: boolean }`
**Called From:** `app/admin/page.js` (Clubs tab)
**Error Handling:** Global interceptor

---

### adminUpdateClub(clubId, data)

**HTTP:** `PATCH /admin/clubs/:clubId`
**Auth:** Yes (admin only)
**Params:** `clubId: number`, `{ name?, description?, location?, is_active? }`
**Returns:** Updated club object
**Called From:** `app/admin/page.js` (Clubs tab edit modal)
**Error Handling:** Global interceptor; page shows `toast.error` on failure

---

### adminGetStats()

**HTTP:** `GET /admin/stats`
**Auth:** Yes (admin only)
**Params:** None
**Returns:** `{ total_users, total_clubs, total_scores, total_disputes, ... }`
**Called From:** `app/admin/page.js` (Stats tab)
**Error Handling:** Global interceptor

---

### adminGetDisputes(status)

**HTTP:** `GET /admin/disputes?status=<status>`
**Auth:** Yes (admin only)
**Params:** `status: string` (values: `''` for all, `'open'`, `'resolved'`)
**Returns:** Array of dispute objects with status, reason, involved users
**Called From:** `app/admin/page.js` (Disputes tab)
**Error Handling:** Global interceptor

---

### adminResolveDispute(disputeId, data)

**HTTP:** `POST /disputes/:disputeId/resolve`
**Auth:** Yes (admin only)
**Params:** `disputeId: number`, `{ status: 'resolved'|'dismissed', notes?: string }`
**Returns:** Updated dispute object
**Called From:** `app/admin/page.js` (Disputes tab resolve modal)
**Error Handling:** Global interceptor; page shows `toast.error` on failure

---

### adminUpdateScore(scoreId, data)

**HTTP:** `PATCH /admin/scores/:scoreId`
**Auth:** Yes (admin only)
**Params:** `scoreId: number`, partial score update object
**Returns:** Updated score object
**Called From:** [UNKNOWN — function exists in `lib/api.js` but not confirmed called from admin page in current code]
**Error Handling:** Global interceptor

---

### syncOfflineScores(items)

**HTTP:** `POST /sync`
**Auth:** Yes
**Params:** `{ items: [{ club_id, played_on, course_name, tee_colour, notes, hole_scores, handicap_override }] }`
**Returns:** `{ results: [{ status: 'created'|'updated'|'success' }] }`
**Called From:** `components/offline/OfflineSyncWrapper.js` (auto-called on `online` event)
**Error Handling:** Component shows loading toast, then success or error toast. On failure, retries on next reconnect.

---

## Stableford Calculator (lib/stableford.js)

### getStrokeAllowance(handicap, strokeIndex)

**Inputs:**
- `handicap: number` — player's playing handicap (e.g. `18.0`)
- `strokeIndex: number` — the hole's stroke index (1–18)

**Output:** `number` — strokes allowed on this hole (0, 1, or 2 for high handicappers)

**Formula:**
```
playingHandicap = Math.round(handicap)
base = Math.floor(playingHandicap / 18)
remainder = playingHandicap % 18
allowance = strokeIndex <= remainder ? base + 1 : base
```

---

### calculateHolePoints(grossShots, par, strokeAllowance)

**Inputs:**
- `grossShots: number` — strokes taken (0 = did not complete)
- `par: number` — hole par (3, 4, or 5)
- `strokeAllowance: number` — from `getStrokeAllowance`

**Output:** `number` — Stableford points (minimum 0)

**Formula:**
```
netScore = grossShots - strokeAllowance
diff = netScore - par
points = max(0, 2 - diff)
```

Points table: Net Eagle (-2) = 4 pts, Net Birdie (-1) = 3 pts, Net Par (0) = 2 pts, Net Bogey (+1) = 1 pt, Net Double Bogey+ = 0 pts.

---

### calculateRoundPoints(holeScores, handicap)

**Inputs:**
- `holeScores: Array<{ hole, par, strokeIndex, shots }>` — 18 holes
- `handicap: number`

**Output:** `{ totalPoints: number, totalShots: number, enrichedHoles: Array }`

Each `enrichedHole` includes: `hole, par, strokeIndex, shots, strokeAllowance, points`.

**Note:** This runs client-side and provides the live running total in the scorecard UI. The backend also validates the result server-side independently.

---

## IndexedDB Schema (lib/offline.js)

**Library:** `idb` (npm package — a Promise wrapper around the IndexedDB API)

**Database Name:** `golf-offline`
**Database Version:** `1`

| Object Store | Key Path | Auto-Increment | Stored Fields |
|---|---|---|---|
| `pending-scores` | `id` | Yes | `club_id`, `club_name`, `played_on`, `course_name`, `tee_colour`, `notes`, `hole_scores`, `handicap_override`, `saved_at` |

**When data is written:** `savePendingScore()` is called in `app/scores/new/page.js` when the network request fails (`!err.response`).

**When data is read:** `OfflineSyncWrapper` calls `getPendingScores()` on every `online` event. Successfully synced items are removed via `deletePendingScore(id)`.

---

## Environment Variables

| Variable | Required | Description | Example Value |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | Yes | Backend base URL | `https://golfappbackend.ayurvedapromise.com` |
| `NEXT_PUBLIC_OPENAI_API_KEY` | Yes (for scanning) | OpenAI API key for GPT-4o Vision scorecard scanning | `sk-your-openai-key-here` |
| `NEXT_PUBLIC_APP_NAME` | No | App display name | `Golf Club Scorer` |

All `NEXT_PUBLIC_` prefixed variables are exposed to the browser bundle. **Never store secrets without this prefix in `.env.local` that should be kept private from the client.**
