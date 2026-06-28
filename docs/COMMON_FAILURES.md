# COMMON_FAILURES.md

> A living log of bugs, gotchas, and non-obvious behaviors encountered during development and deployment. **Always check here before debugging.** Add new entries before fixing any certified module.

---

## CF-001: Vercel Build Failure — @secret References

**Symptom:** Vercel build fails immediately at environment variable resolution with a secret resolution error. Build log shows something like: `Could not resolve secret reference`.

**Root Cause:** An earlier version of `vercel.json` contained `@secret` syntax (e.g. `"NEXT_PUBLIC_API_URL": "@golf-api-url"`). This syntax requires the Vercel secret store to be pre-configured with those named secrets. If the secrets are not created in the Vercel project, the build fails before any code runs.

**Fix Applied:** Removed all `@secret` references from `vercel.json`. The file now only contains `framework`, `buildCommand`, and `outputDirectory`. All environment variables are now set directly via the Vercel dashboard: **Project Settings → Environment Variables**.

**Affected Files:** `vercel.json`

**Test Added:** No (deployment-level fix; validated via successful Vercel build)

**Tags:** [vercel] [deployment]

---

## CF-002: API Calls Failing in Production — Wrong Base URL

**Symptom:** All API calls return network errors in the deployed Vercel app even though they work locally. Browser console shows `ERR_CONNECTION_REFUSED` or CORS errors pointing to `http://103.55.104.142:5030`.

**Root Cause:** `NEXT_PUBLIC_API_URL` in the Vercel dashboard was left pointing to the direct IP and port (`http://103.55.104.142:5030`). The production backend is served via Nginx at the HTTPS subdomain URL. The IP+port combination is not accessible from external browsers due to firewall rules and the lack of TLS.

**Fix Applied:** Updated `NEXT_PUBLIC_API_URL` in the Vercel dashboard Environment Variables to `https://golfappbackend.ayurvedapromise.com`. Triggered a redeploy.

**Affected Files:** Vercel environment variables (not source code)

**Test Added:** No (validated via Playwright preflight test `backend is reachable` and manual smoke test)

**Tags:** [deployment] [api] [vercel]

---

## CF-003: Handicap Not Updating on Score Submit

**Symptom:** User changes their handicap via the inline edit on `/scores/new` (Step 2), submits the scorecard, but the profile handicap displayed on the dashboard still shows the old value.

**Root Cause:** The original score submission flow only called `createGame` and `submitScore`. It did not call `updateProfile` to persist the handicap change to the backend, even when the user had explicitly edited it on the form.

**Fix Applied:** Added Step C to the `handleSubmitScorecard` function in `app/scores/new/page.js`. After a successful score submission, the code calls `updateProfile({ handicap: parsedHandicap })` silently (error is caught but does not block success feedback). The Zustand store is updated via `useAuthStore.getState().updateUser(profileResponse.data)`. If the profile update fails, a separate toast error is shown advising the user to update manually from the dashboard.

**Affected Files:** `app/scores/new/page.js`, `lib/api.js` (uses existing `updateProfile`)

**Test Added:** No (would require checking dashboard handicap value after score submit — not yet in Playwright suite)

**Tags:** [ui] [scoring] [handicap]

---

## CF-004: CORS Error on Preflight

**Symptom:** Browser blocks API requests with CORS error on OPTIONS preflight. Console shows: `Access-Control-Allow-Origin header is not present` or similar. Authenticated requests return CORS errors despite working in Postman.

**Root Cause:** The backend FastAPI app had `CORSMiddleware` configured with `allow_credentials=True` and `allow_origins=["*"]`. Browsers explicitly prohibit combining `allow_credentials=True` with a wildcard origin. When a request includes an `Authorization` header, the browser first sends an OPTIONS preflight which the server rejected with a CORS violation.

**Fix Applied:** Backend was updated to set `allow_credentials=False`. This is safe because the frontend authenticates using Bearer tokens in the `Authorization` header — not cookies. Removing credentials mode has no functional impact on the frontend auth flow.

**Affected Files:** Backend `app/main.py` (fixed on backend side — frontend code unchanged)

**Test Added:** Indirectly covered by all Playwright tests that make authenticated API calls

**Tags:** [cors] [api] [backend]

---

## CF-005: IndexedDB Offline Cache Not Auto-Syncing Reliably

**Symptom:** Scores submitted offline (saved to IndexedDB) occasionally do not sync automatically when connectivity is restored. The sync toast appears briefly but the scores remain in IndexedDB on subsequent visits.

**Root Cause:** The `OfflineSyncWrapper` component listens to the browser `online` event and calls `syncOfflineScores()`. However, the sync endpoint (`POST /sync`) may return a 200 response with a results array where individual item statuses are inconsistently structured between backend versions. The component's success check (`itemResult.status === 'created' || itemResult.status === 'success' || response.status === 200`) is broad but relies on consistent response shape. If the backend returns a different status string or an unexpected array structure, `deletePendingScore(item.id)` is never called, leaving stale items in IndexedDB.

**Fix Applied:** The current implementation uses a broad fallback: if `response.status === 200`, all items are treated as synced and deleted. This resolves most cases but is not fully robust to partial failure scenarios.

**Known Limitation:** The `POST /sync` endpoint does not currently support partial success — if one score fails backend validation, the entire batch may be rejected. Users can manually navigate to `/dashboard` to see which scores are in the leaderboard and manually re-submit any missing ones via `/scores/new`.

**Affected Files:** `components/offline/OfflineSyncWrapper.js`, `lib/offline.js`, `lib/api.js`

**Test Added:** Yes — `08-offline.spec.js` covers offline banner, IndexedDB save, and reconnect banner dismissal (but not full sync validation to leaderboard)

**Tags:** [pwa] [indexeddb] [offline]

---

## CF-006: Admin Page Accessible Before Auth Hydration

**Symptom:** On a fast connection, briefly navigating to `/admin` as a non-admin user shows a flash of the admin page layout before redirecting to `/dashboard`.

**Root Cause:** The `useEffect` that checks `user.is_admin` only runs after the component mounts and `initialize()` completes. During the hydration window (`isLoading = true`), there is no guard — the page renders its skeleton/loading state but does not yet redirect.

**Fix Applied:** The component renders nothing (returns null or skeleton) while `isLoading` is true. The redirect runs only after `!isLoading && user && !user.is_admin`. This creates a ~100ms flash of skeleton but prevents any admin UI from rendering for unauthorized users.

**Affected Files:** `app/admin/page.js`

**Test Added:** Yes — `07-admin.spec.js`: `non-admin cannot access /admin`

**Tags:** [auth] [admin] [ui]

---

## CF-007: Service Worker Cached Stale Assets After Redeployment

**Symptom:** After a Vercel redeployment, some users continue to see the old version of the app for hours or until they hard-reload. New features appear to be missing.

**Root Cause:** `next-pwa` generates a service worker that aggressively caches JS/CSS assets. The service worker's cache is keyed by asset filenames. Next.js uses content-hash-based filenames, so new deploys generate new filenames and the service worker eventually detects the change — but only when it re-checks the manifest. The `skipWaiting: true` setting in `next.config.js` means the new SW takes control immediately, but some users may not have the new SW installed yet.

**Fix Applied:** `next.config.js` already sets `skipWaiting: true` and `register: true` which instructs the SW to activate immediately on update. No additional fix was applied. Users who experience this should hard-reload (Ctrl+Shift+R) or clear site data.

**Known Limitation:** No manual cache-busting mechanism is implemented. If this becomes a persistent problem, consider adding a version number to the manifest or implementing a cache-clear notification UI.

**Affected Files:** `next.config.js`, `public/sw.js` (generated)

**Test Added:** No

**Tags:** [pwa] [vercel] [deployment]

---

## CF-008: Handicap Precision Loss in Display

**Symptom:** A user's handicap of `18` (integer from backend) displays as `18.0` in the stats bar but as `18` in the edit input on initial load, causing visual inconsistency.

**Root Cause:** The dashboard stats bar uses `.toFixed(1)` to always show one decimal place. The handicap edit input initializes with `user.handicap.toString()` which omits the decimal for whole numbers.

**Fix Applied:** This is cosmetic only and considered acceptable. No code change made. If fixed, ensure the input field also normalizes display via `.toFixed(1)` and that the input still accepts user entry of whole numbers like `18`.

**Affected Files:** `app/dashboard/page.js`, `app/scores/new/page.js`

**Test Added:** No

**Tags:** [ui] [handicap]

---

## CF-009: Incorrect Par and SI Values on Scorecard Entry

**Symptom:** Scorecard entry page showed wrong Par values for holes 2, 3, 4 and wrong SI
values for all 18 holes. Stableford stroke allowance was calculated against incorrect SI,
producing wrong points.

**Root Cause:** Par and SI values were hardcoded inline in `app/scores/new/page.js`
as editable input defaults and were entered incorrectly during initial build.
Additionally, making them editable allowed accidental user modification.

**Fix Applied:**
- Created `lib/courseData.js` as single source of truth for all hole data
- Replaced all inline hardcoded values with `COURSE_HOLES` import
- Changed Par and SI columns from `<input>` to plain text — no longer user-editable

**Affected Files:**
- `lib/courseData.js` (created)
- `app/scores/new/page.js` (updated)
- `components/scores/HoleScoreInput.js` (updated if par/si were rendered there)

**Test Added:** No — manual verification against physical scorecard.
Correct values: SI=[5,9,11,17,7,13,1,15,3,6,18,16,4,12,2,10,8,14], Par 72.

**Tags:** [scoring] [stableford] [data-correction]

---

## CF-011: hole_scores Field Name — "shots" not "gross_score"

**Symptom:** POST /admin/scores returns 422 — "Field required" for "shots" on every hole.
**Root Cause:** The backend HoleScoreInput schema uses "shots" as the field name for
gross score per hole. The frontend prompt originally used "gross_score" which does not
match the certified schema.
**Fix Applied:** hole_scores payload uses "shots" in all admin score submission calls.
Confirmed via live smoke test — correct field name is "shots".
**Affected Files:** lib/api.js (adminAddScore, adminEditScore)
**Test Added:** No — verified via live smoke test on backend.
**Tags:** [api] [admin] [scoring]

---

## CF-010: axios DELETE with Request Body

**Symptom:** DELETE /admin/scores/{id} returns 422 — delete_note not received by backend.
**Root Cause:** axios.delete() does not send a body by default. Must use
{ data: { delete_note: ... } } as the config parameter, not the second argument.
**Fix Applied:** adminDeleteScore uses api.delete(url, { data: { delete_note } })
**Affected Files:** lib/api.js
**Test Added:** No — verified manually.
**Tags:** [api] [admin]


