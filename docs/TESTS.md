# TESTS.md

> E2E test suite documentation. Read before adding or modifying tests.

---

## Test Approach

- **E2E tests written in Playwright** (JavaScript, CommonJS)
- **Tests live in a separate project:** `golf_app_e2e_test/` (sibling directory to `golf_app_frontend/`)
- **Full path:** `/home/rpsoftwarelab/Documents/2026_Projects/golf_app_e2e_test/`
- **No unit tests exist** for any frontend module at this time (including `lib/stableford.js`)
- Tests use shared helpers in `golf_app_e2e_test/helpers/` (actions.js, data.js, db.js)
- Screenshots are saved to `golf_app_e2e_test/screenshots/` during test runs

---

## How To Run Tests

```bash
# E2E tests (Playwright)
cd /home/rpsoftwarelab/Documents/2026_Projects/golf_app_e2e_test

npx playwright test                   # run all suites in sequence
npx playwright test --headed          # with browser visible
npx playwright test tests/01-auth     # run auth suite only
npx playwright test tests/03-scores   # run scores suite only
npx playwright show-report            # view HTML report from last run

# Prerequisites: frontend must be running
cd /home/rpsoftwarelab/Documents/2026_Projects/golf_app_frontend
npm run dev                           # start dev server on localhost:3000

# Unit tests
# Not currently configured. No unit test runner is set up.
```

---

## Test Files

### 00-preflight.spec.js

**Path:** `golf_app_e2e_test/tests/00-preflight.spec.js`
**Purpose:** Sanity checks that both frontend and backend are reachable before the full suite runs.

| Test Name | Description |
|---|---|
| `frontend is reachable` | GETs `/`, expects 200 and title containing "Golf" |
| `backend is reachable` | GETs `/health` on backend, expects `{ status: 'ok', database: 'connected' }` |

---

### 01-auth.spec.js

**Path:** `golf_app_e2e_test/tests/01-auth.spec.js`
**Purpose:** Full auth lifecycle — register, login, logout, protected route redirect, admin setup.

| Test Name | Description |
|---|---|
| `landing page loads correctly` | Checks heading, Sign In button, Create Account button, Coming Soon badge |
| `register player 1` | Registers PLAYER_1 via `/register`, verifies dashboard greeting shows name |
| `logout works` | Navigates to dashboard, logs out, verifies redirect to `/login` or `/` |
| `login with wrong password fails` | Submits wrong credentials, expects error alert/toast, stays on `/login` |
| `login with correct password succeeds` | Logs in as PLAYER_1, verifies name on dashboard |
| `protected route redirects when not logged in` | Unauthenticated access to `/dashboard` redirects to `/login` |
| `register player 2 (needed for later tests)` | Registers PLAYER_2 in a separate browser context |
| `register admin user and set admin flag` | Registers ADMIN_USER, then sets `is_admin=true` directly in DB via `helpers/db.js` |

---

### 02-clubs.spec.js

**Path:** `golf_app_e2e_test/tests/02-clubs.spec.js`
**Purpose:** Club creation, membership management, and member count.

| Test Name | Description |
|---|---|
| `clubs page loads` | Verifies `/clubs` heading visible after login |
| `create a new club` | Fills create club form, verifies club appears in list |
| `creator is automatically a member` | Verifies "Joined" indicator and no Join button for creator |
| `player 2 joins the club` | PLAYER_2 clicks Join, verifies "Joined" state |
| `duplicate join is blocked` | Verifies Join button disappears after joining |
| `member count increases` | Verifies club card shows at least 2 members after both players join |

---

### 03-scores.spec.js

**Path:** `golf_app_e2e_test/tests/03-scores.spec.js`
**Purpose:** Full 2-step score entry flow, Stableford live calculation, submission, and duplicate prevention.

| Test Name | Description |
|---|---|
| `navigate to add score page` | Clicks Add Score from dashboard, lands on `/scores/new` with Step 1 visible |
| `fill game details (step 1)` | Selects club, fills course name and tee colour, proceeds to Step 2 |
| `scan button is visible on step 2` | Verifies Scan Scorecard button is present on Step 2 |
| `fill 18 hole scores manually` | Enters shots for all 18 holes via table inputs |
| `live Stableford calculation is correct` | Verifies total points (28) and gross shots (94) after filling scores |
| `submit score` | Completes full flow, submits, expects redirect to `/dashboard` |
| `score appears on dashboard` | Verifies club name and score totals visible in dashboard recent scores |
| `duplicate score submission is blocked` | Submits identical score again, expects error toast |

---

### 04-leaderboard.spec.js

**Path:** `golf_app_e2e_test/tests/04-leaderboard.spec.js`
**Purpose:** Leaderboard navigation, score visibility, current user highlighting, rank display.

| Test Name | Description |
|---|---|
| `navigate to leaderboard` | Clicks club card from `/clubs`, lands on leaderboard page |
| `leaderboard shows player 1` | Verifies PLAYER_1's name and 28 points visible in table |
| `current user row is highlighted` | Verifies PLAYER_1's row has a highlight class or style |
| `rank is displayed` | Verifies rank 1 / gold styling visible in PLAYER_1's row |
| `my rank banner` | Verifies "Your rank: #1" banner visible at top of leaderboard |
| `load more button` | Checks Load More button — skips if total players <= 10 |

---

### 05-pending.spec.js

**Path:** `golf_app_e2e_test/tests/05-pending.spec.js`
**Purpose:** Peer-submitted scorecard approval workflow end-to-end.

| Test Name | Description |
|---|---|
| `player 1 submits score for player 2` | PLAYER_1 submits a score on behalf of PLAYER_2 |
| `player 2 sees pending approval` | PLAYER_2 navigates to `/pending-approvals`, sees submitted card |
| `player 2 can expand hole scores` | PLAYER_2 clicks View/Expand to see hole-by-hole breakdown |
| `wrong user cannot approve` | PLAYER_1 cannot see PLAYER_2's pending approval on their own list |
| `player 2 approves the score` | PLAYER_2 clicks Approve, verifies success toast and card removal |
| `score appears on leaderboard after approval` | PLAYER_2 now appears on the club leaderboard |

---

### 06-disputes.spec.js

**Path:** `golf_app_e2e_test/tests/06-disputes.spec.js`
**Purpose:** Dispute raising, viewing, and duplicate prevention.

| Test Name | Description |
|---|---|
| `raise a dispute on player 2's score` | PLAYER_1 raises dispute on PLAYER_2's leaderboard entry with reason text |
| `dispute appears in my disputes` | PLAYER_1 sees dispute at `/disputes` with status "Open" |
| `duplicate dispute is blocked` | Attempting second dispute on same score shows error toast |

---

### 07-admin.spec.js

**Path:** `golf_app_e2e_test/tests/07-admin.spec.js`
**Purpose:** Admin panel access control, tabs, user/club management, dispute resolution.

| Test Name | Description |
|---|---|
| `non-admin cannot access /admin` | PLAYER_1 navigating to `/admin` is redirected to `/dashboard` |
| `admin can access /admin` | ADMIN_USER reaches `/admin` and sees Users, Clubs, Disputes sections |
| `admin users tab loads` | Users tab shows PLAYER_1 and PLAYER_2 emails |
| `admin user search works` | Search by PLAYER_1 name hides PLAYER_2; clearing restores all |
| `admin clubs tab loads` | Clubs tab shows the created club with member count |
| `admin disputes tab loads` | Disputes tab shows the open dispute from 06-disputes |
| `admin resolves dispute` | Admin selects "Resolved" status, adds notes, confirms — status changes |
| `admin stats tab loads` | Stats tab shows non-zero counts for users, clubs, scores, disputes |

---

### 08-offline.spec.js

**Path:** `golf_app_e2e_test/tests/08-offline.spec.js`
**Purpose:** PWA offline mode — banner, score saving to IndexedDB, auto-sync on reconnect.

| Test Name | Description |
|---|---|
| `offline banner appears when network disabled` | Simulates offline, verifies offline banner visible |
| `app still renders when offline` | Navigation to `/clubs` works offline (SPA routing / cached shell) |
| `score saved to IndexedDB when offline` | Full score entry while offline — verifies "saved locally" toast |
| `auto-sync when back online` | Toggles back online, verifies offline banner disappears |

---

## Pages Covered

| Page / Flow | Test File | Playwright Test Name(s) | Status |
|---|---|---|---|
| Landing page | `01-auth.spec.js` | `landing page loads correctly` | ✅ Covered |
| Register | `01-auth.spec.js` | `register player 1`, `register player 2`, `register admin user` | ✅ Covered |
| Login | `01-auth.spec.js` | `login with wrong password fails`, `login with correct password succeeds` | ✅ Covered |
| Logout | `01-auth.spec.js` | `logout works` | ✅ Covered |
| Protected route | `01-auth.spec.js` | `protected route redirects when not logged in` | ✅ Covered |
| Dashboard | `03-scores.spec.js` | `score appears on dashboard` | ✅ Covered (partial) |
| Clubs | `02-clubs.spec.js` | All 6 tests | ✅ Covered |
| Leaderboard | `04-leaderboard.spec.js` | All 6 tests | ✅ Covered |
| Add Score | `03-scores.spec.js` | All 8 tests | ✅ Covered |
| Pending Approvals | `05-pending.spec.js` | All 6 tests | ✅ Covered |
| Admin Panel | `07-admin.spec.js` | All 8 tests | ✅ Covered |
| Disputes | `06-disputes.spec.js` | All 3 tests | ✅ Covered |
| Offline Mode | `08-offline.spec.js` | All 4 tests | ✅ Covered |

---

## What Is Not Covered

| Page / Flow | Notes |
|---|---|
| Dashboard — handicap inline edit | No test verifies the pencil/save flow on dashboard stats bar |
| Dashboard — score details modal | No test verifies clicking a score card opens the hole-by-hole modal |
| Dashboard — load more scores pagination | Not tested |
| Add Score — scan scorecard (GPT-4o) | No automated test — requires real image and OpenAI key; must be tested manually |
| Clubs — search/filter | No test for the local search input on `/clubs` |
| Clubs — load more pagination | Not tested |
| Register — validation errors | No test for client-side form validation (short password, invalid email, handicap > 54) |
| `/disputes` page | Test navigates to `/disputes` but no page component was found in `app/` — may be missing or backend-only |
| Unit tests for `lib/stableford.js` | No unit test runner configured; Stableford is only tested indirectly via E2E `03-scores.spec.js` |

---

## Adding New Tests

**Rules:**

1. New page tests go in a new file named after the page: `<pagename>.spec.js`
2. Every new feature must include: happy path, auth-required redirect (unauthenticated user), and at least one error state
3. Use the existing helper pattern — import from `../helpers/actions` (loginUser, registerUser, logoutUser) and `../helpers/data` (PLAYER_1, PLAYER_2, CLUB, etc.)
4. Run the full suite after adding tests and confirm total test count increases:
   ```bash
   npx playwright test --reporter=list
   ```
5. Save screenshots using `await page.screenshot({ path: './screenshots/<name>.png' })` at key assertions
