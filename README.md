# Golf Club Scoring Web App — Next.js Frontend (Phase 1)

A clean, premium, and minimal Next.js frontend application built for a South African golf club, allowing members to log their scorecards, track their handicap, and view active club leaderboards.

This project is completely decoupled from `golf-backend` and communicates via REST API.

---

## Technical Stack

* **Framework:** Next.js 14 (App Router)
* **Language:** JavaScript (ES6+)
* **Styling:** Tailwind CSS 3
* **State Management:** Zustand
* **HTTP Client:** Axios
* **Forms:** React Hook Form
* **Notifications:** React Hot Toast
* **Icons:** Lucide React

---

## Setup & Running Locally

1. **Clone and Navigate to the Repository:**
   ```bash
   cd golf_app_frontend
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy the example environment template to your local `.env.local` file:
   ```bash
   cp .env.local.example .env.local
   ```
   Open `.env.local` and configure:
   ```env
   NEXT_PUBLIC_API_URL=http://103.55.104.142:5030
   NEXT_PUBLIC_APP_NAME=Golf Club Scorer
   ```

4. **Run the Development Server:**
   ```bash
   npm run dev
   ```

5. **Access the App:**
   Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## Folder Structure

```
golf-frontend/
├── app/
│   ├── layout.js              ← Root layout (fonts, metadata, client layout)
│   ├── page.js                ← Landing page (home)
│   ├── globals.css            ← Tailwind base + custom CSS variables & animations
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.js        ← Login page
│   │   └── register/
│   │       └── page.js        ← Register page
│   ├── dashboard/
│   │   └── page.js            ← Personal dashboard (user stats, clubs & recent scores)
│   ├── clubs/
│   │   ├── page.js            ← Browse and join clubs
│   │   └── [clubId]/
│   │       └── leaderboard/
│   │           └── page.js    ← Club leaderboard
│   └── scores/
│       └── new/
│           └── page.js        ← Add new score manually
├── components/
│   ├── layout/
│   │   ├── Navbar.js          ← Top navigation bar (desktop only)
│   │   ├── BottomNav.js       ← Mobile bottom navigation bar
│   │   ├── ClientLayout.js    ← Toaster provider & auth store hydration
│   │   └── PageWrapper.js     ← Max-width wrapper with bottom padding for mobile
│   ├── ui/
│   │   ├── Button.js          ← Reusable button component (supports variants, loading, disabled)
│   │   ├── Input.js           ← Reusable input component with forwardRef support
│   │   ├── Card.js            ← Reusable container card
│   │   ├── Badge.js           ← Status and rank badge
│   │   ├── Skeleton.js        ← Loading skeleton pulse block
│   │   └── EmptyState.js      ← Centered empty feedback block with call to action
│   ├── auth/
│   │   └── ProtectedRoute.js  ← Wrapper component protecting auth routes
│   ├── dashboard/
│   │   ├── ScoreCard.js       ← Single score card widget
│   │   └── StatsBar.js        ← User aggregated metrics (points, rounds, handicap)
│   ├── leaderboard/
│   │   ├── LeaderboardTable.js ← Ranked table of players
│   │   └── LeaderboardRow.js   ← Single player row
│   └── scores/
│       └── HoleScoreInput.js  ← Single hole input row for the scorecard
├── lib/
│   ├── api.js                 ← Axios client instance with token interceptors & error handlers
│   ├── auth.js                ← Token and user local storage helpers
│   └── stableford.js          ← Client-side Stableford points calculator
├── store/
│   └── useAuthStore.js        ← Zustand authentication store
├── hooks/
│   ├── useAuth.js             ← Custom auth verification redirect hook
│   └── useApi.js              ← Generic fetch handler hook managing loading/error states
```

---

## Developer Guide: How to Add a New Page

To add a new page (e.g. `/profile`), follow these simple steps:

1. **Create the Folder & File:**
   Under the `app/` folder, create a new directory and name it after your route. Then, add a `page.js` file inside it.
   ```
   app/
   └── profile/
       └── page.js
   ```

2. **Add the Page Component Structure:**
   In your `app/profile/page.js` file, export a default React component:
   ```javascript
   'use client'

   import React from 'react'
   import PageWrapper from '../components/layout/PageWrapper'

   export default function ProfilePage() {
     return (
       <PageWrapper>
         <h1 className="text-2xl font-bold font-display text-green-dark">My Profile</h1>
         <p className="text-sm text-grey-mid mt-2">Manage your profile details.</p>
       </PageWrapper>
     )
   }
   ```

3. **To Make it Protected (Requires Log In):**
   Wrap the JSX of your page in the `<ProtectedRoute>` component:
   ```javascript
   import ProtectedRoute from '../components/auth/ProtectedRoute'

   // Inside return statement:
   return (
     <ProtectedRoute>
       <PageWrapper>
         {/* Page elements go here */}
       </PageWrapper>
     </ProtectedRoute>
   )
   ```
