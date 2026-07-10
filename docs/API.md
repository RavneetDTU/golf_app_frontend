# API.md
# Golf Club Scoring App — API Reference

> **Single source of truth for every HTTP endpoint.**
> Generated from actual router source code. Do not invent endpoints here.

---

## Base URLs

| Environment | URL |
|---|---|
| Development (direct) | `http://103.55.104.142:5029` |
| Production | `https://golfappbackend.ayurvedapromise.com` |
| Local dev | `http://localhost:8000` (when running `uvicorn app.main:app --reload`) |

---

## Authentication

All protected endpoints require a JWT Bearer token in the `Authorization` header:

```
Authorization: Bearer <token>
```

Tokens are issued by `POST /auth/login` (or `POST /auth/register`). Tokens expire after **1440 minutes (24 hours)** by default (configured via `JWT_EXPIRE_MINUTES` env var).

**Algorithm:** HS256, signed with `JWT_SECRET_KEY`.
**No Supabase involvement.** Auth is 100% self-hosted.

The `sub` claim in the JWT payload is the user's UUID.

---

## Response Format

All endpoints return JSON. Successful responses return the resource directly (no wrapper envelope). For example:

```json
{
  "id": "uuid",
  "email": "user@example.com",
  ...
}
```

Paginated list endpoints return a standard pagination envelope:

```json
{
  "items_key": [...],
  "total": 42,
  "page": 1,
  "per_page": 10,
  "has_more": true
}
```

---

## Error Format

All error responses use the following shape:

```json
{
  "detail": "Human-readable error message",
  "success": false
}
```

Validation errors (HTTP 422) return `detail` as an array of Pydantic error objects.
Database integrity conflicts return HTTP 409 with a generic conflict message.
Unhandled server errors return HTTP 500 with a generic message — no stack traces are exposed to clients.

---

## Health

### GET /health

**Auth required:** No (public endpoint)
**Role required:** None

**Response:**
```json
{
  "status": "ok",
  "app_env": "production",
  "database": "connected",
  "version": "1.0.0",
  "timestamp": "2026-06-11T10:00:00Z"
}
```

**Notes:**
- Always returns HTTP 200, even when the database is unreachable.
- `status` is `"ok"` when DB is reachable, `"degraded"` when not.
- `database` is `"connected"` or `"disconnected"`.
- Monitoring tools must inspect the `status` field, not just the HTTP status code.

---

## Auth

### POST /auth/register

**Auth required:** No
**Role required:** None

**Request Body:**
| Field | Type | Required | Constraints |
|---|---|---|---|
| `email` | string (email) | Yes | Unique across all users |
| `password` | string | Yes | min_length=8 |
| `full_name` | string | Yes | min_length=2 |
| `handicap` | float | No (default 0.0) | 0.0 <= value <= 54.0 |

**Response (HTTP 201):**
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "expires_in": 86400,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "Jane Smith",
    "handicap": 12.5,
    "is_admin": false,
    "created_at": "2026-06-11T10:00:00Z"
  }
}
```

**Notes:**
- Registration immediately issues a token — no separate login step required.
- Duplicate email returns HTTP 409.
- Weak password (< 8 chars) returns HTTP 422.

---

### POST /auth/login

**Auth required:** No
**Role required:** None

**Request Body:**
| Field | Type | Required |
|---|---|---|
| `email` | string (email) | Yes |
| `password` | string | Yes |

**Response (HTTP 200):** Same as `/auth/register` response shape (TokenResponse).

**Notes:**
- Wrong password returns HTTP 401.
- Unknown email returns HTTP 401.
- Inactive user returns HTTP 403.

---

### GET /auth/me

**Auth required:** Yes
**Role required:** Any authenticated user

**Response (HTTP 200):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "full_name": "Jane Smith",
  "handicap": 12.5,
  "is_admin": false,
  "created_at": "2026-06-11T10:00:00Z"
}
```

---

### PATCH /auth/me

**Auth required:** Yes
**Role required:** Any authenticated user

**Request Body (all fields optional):**
| Field | Type | Required | Constraints |
|---|---|---|---|
| `full_name` | string | No | min_length=2 |
| `handicap` | float | No | 0.0 <= value <= 54.0 |

**Response (HTTP 200):** Updated UserResponse.

**Notes:**
- Only `full_name` and `handicap` are user-editable. Email cannot be changed via this endpoint.
- Invalid handicap (e.g. 55.0) returns HTTP 422.

---

## Clubs

### POST /clubs

**Auth required:** Yes
**Role required:** Any authenticated user

**Request Body:**
| Field | Type | Required | Constraints |
|---|---|---|---|
| `name` | string | Yes | min_length=3, max_length=255 |
| `description` | string | No | |
| `location` | string | No | |

**Response (HTTP 201):**
```json
{
  "id": "uuid",
  "name": "Oak Valley Golf Club",
  "description": "18-hole course",
  "location": "Elgin, Western Cape",
  "created_by": "uuid",
  "member_count": 1,
  "is_member": true,
  "created_at": "2026-06-11T10:00:00Z"
}
```

**Notes:**
- Creator is automatically added as the first member (membership created server-side).
- `is_member` reflects whether the requesting user is a member of this club.

---

### GET /clubs

**Auth required:** Yes
**Role required:** Any authenticated user

**Query Parameters:**
| Param | Type | Default | Constraints |
|---|---|---|---|
| `page` | int | 1 | >= 1 |
| `per_page` | int | 10 | 1-100 |

**Response (HTTP 200):**
```json
{
  "clubs": [...],
  "total": 12,
  "page": 1,
  "per_page": 10,
  "has_more": true
}
```

---

### GET /clubs/{club_id}

**Auth required:** Yes
**Role required:** Any authenticated user

**Path Parameters:**
| Param | Type |
|---|---|
| `club_id` | UUID |

**Response (HTTP 200):** ClubResponse (same shape as POST /clubs response).

**Notes:**
- Returns HTTP 404 if club does not exist or is inactive.

---

### POST /clubs/{club_id}/join

**Auth required:** Yes
**Role required:** Any authenticated user

**Path Parameters:**
| Param | Type |
|---|---|
| `club_id` | UUID |

**Response (HTTP 200):**
```json
{"message": "Joined club successfully"}
```

**Notes:**
- Returns HTTP 409 if the user is already a member.

---

### DELETE /clubs/{club_id}/leave

**Auth required:** Yes
**Role required:** Any authenticated user

**Path Parameters:**
| Param | Type |
|---|---|
| `club_id` | UUID |

**Response (HTTP 200):**
```json
{"message": "Left club successfully"}
```

**Notes:**
- Returns HTTP 404 if the user is not a member of this club.

---

## Scores

### POST /games

**Auth required:** Yes
**Role required:** Any authenticated user (must be a club member)

**Request Body:**
| Field | Type | Required | Constraints |
|---|---|---|---|
| `club_id` | UUID | Yes | User must be a member of this club |
| `played_on` | date | No (default today) | ISO date string |
| `course_name` | string | No | |
| `tee_colour` | string | No | e.g. Yellow, White, Blue, Red |
| `notes` | string | No | |

**Response (HTTP 201):**
```json
{
  "id": "uuid",
  "club_id": "uuid",
  "played_on": "2026-06-11",
  "course_name": "Oak Valley",
  "tee_colour": "Yellow",
  "created_by": "uuid",
  "created_at": "2026-06-11T10:00:00Z"
}
```

**Notes:**
- Returns HTTP 403 if the user is not a member of the club.

---

### POST /games/{game_id}/scores

**Auth required:** Yes
**Role required:** Any authenticated user

**Path Parameters:**
| Param | Type |
|---|---|
| `game_id` | UUID |

**Request Body:**
| Field | Type | Required | Constraints |
|---|---|---|---|
| `hole_scores` | array | Yes | Exactly 18 items; holes 1-18 each present once |
| `hole_scores[].hole` | int | Yes | 1-18 |
| `hole_scores[].shots` | int | Yes | >= 0 (0 = did not complete hole) |
| `hole_scores[].par` | int | Yes | 3, 4, or 5 |
| `hole_scores[].stroke_index` | int | Yes | 1-18 (hole difficulty rank) |
| `handicap_override` | float | No | 0.0-54.0; overrides stored handicap |

**Response (HTTP 201):**
```json
{
  "id": "uuid",
  "game_id": "uuid",
  "user_id": "uuid",
  "gross_shots": 72,
  "handicap_used": 18.0,
  "stableford_points": 36,
  "hole_scores": [...],
  "is_verified": true,
  "created_at": "2026-06-11T10:00:00Z"
}
```

**Notes:**
- Stableford points are calculated server-side from `hole_scores` and `handicap_used`.
- `shots=0` on a hole always gives 0 points (did not complete).
- Returns HTTP 409 if the user already has a score for this game.
- Score is auto-verified (`is_verified=true`) when a player submits their own score.

---

### GET /games/{game_id}/scores

**Auth required:** Yes
**Role required:** Any authenticated user

**Path Parameters:**
| Param | Type |
|---|---|
| `game_id` | UUID |

**Response (HTTP 200):** Array of ScoreResponse objects (only verified scores).

---

### GET /games/{game_id}/scores/my

**Auth required:** Yes
**Role required:** Any authenticated user

**Path Parameters:**
| Param | Type |
|---|---|
| `game_id` | UUID |

**Response (HTTP 200):** Single ScoreResponse for the current user.

**Notes:**
- Returns HTTP 404 if the user has no score for this game.

---

### GET /scores/my

**Auth required:** Yes
**Role required:** Any authenticated user

**Query Parameters:**
| Param | Type | Default | Constraints |
|---|---|---|---|
| `page` | int | 1 | >= 1 |
| `per_page` | int | 10 | 1-100 |

**Response (HTTP 200):**
```json
{
  "scores": [
    {
      "id": "uuid",
      "game_id": "uuid",
      "user_id": "uuid",
      "gross_shots": 72,
      "handicap_used": 18.0,
      "stableford_points": 36,
      "hole_scores": [...],
      "is_verified": true,
      "created_at": "2026-06-11T10:00:00Z",
      "club_name": "Oak Valley",
      "played_on": "2026-06-11",
      "course_name": "Oak Valley Championship",
      "tee_colour": "Yellow"
    }
  ],
  "total": 25,
  "page": 1,
  "per_page": 10,
  "has_more": true
}
```

**Notes:**
- Enriched with `club_name`, `played_on`, `course_name`, `tee_colour` from the joined game/club.

---

### POST /scores/quick

**Auth required:** Yes
**Role required:** Any authenticated user (must be an active club member)

**Request Body:**
| Field | Type | Required | Constraints |
|---|---|---|---|
| `club_id` | UUID | Yes | User must be a member of this club |
| `round_number` | int | Yes | >= 1 |
| `gross_shots` | int | No | > 0 (can be omitted; if omitted, no gross shots value is stored) |
| `stableford_points` | int | Yes | >= 0 |
| `confirm_overwrite` | bool | No (default: false) | Set to true to overwrite existing score |

**Response (HTTP 201):**
```json
{
  "score_id": "uuid",
  "game_id": "uuid",
  "round_number": 5,
  "game_created": true,
  "overwritten": false,
  "gross_shots": 78,
  "stableford_points": 36
}
```

**Notes:**
- Creates a new game if one does not exist for the given `club_id` and `round_number` (played_on defaults to today).
- Returns HTTP 400 if user is not active member of the club.
- Returns HTTP 409 if a score already exists for that user and round, and `confirm_overwrite` is false. The response body includes the existing score's `gross_shots`, `stableford_points`, `round_number`, and a message.
- Score is automatically verified.

---

## Pending Scores

### POST /pending-scores

**Auth required:** Yes
**Role required:** Any authenticated user

**Request Body:**
| Field | Type | Required | Constraints |
|---|---|---|---|
| `target_user_id` | UUID | Yes | The player the score is being submitted FOR |
| `game_id` | UUID | Yes | |
| `hole_scores` | array | Yes | Exactly 18 items (same shape as score submission) |
| `handicap_override` | float | No | 0.0-54.0 |

**Response (HTTP 201):**
```json
{
  "id": "uuid",
  "game_id": "uuid",
  "submitted_for": "uuid",
  "submitted_for_name": "Jane Smith",
  "submitted_by": "uuid",
  "submitted_by_name": "John Doe",
  "gross_shots": 72,
  "handicap_used": 15.0,
  "stableford_points": 36,
  "hole_scores": [...],
  "status": "pending",
  "created_at": "2026-06-11T10:00:00Z"
}
```

**Notes:**
- Returns HTTP 403 if either the submitter or the target user is not a member of the game's club.
- The score does NOT appear on the leaderboard until the target user approves it.
- `status` is always `"pending"` on creation.

---

### GET /pending-scores/mine

**Auth required:** Yes
**Role required:** Any authenticated user

**Response (HTTP 200):** Array of PendingScoreResponse objects for scores submitted on behalf of the current user (i.e., `submitted_for == current_user.id`).

---

### POST /pending-scores/{pending_score_id}/approve

**Auth required:** Yes
**Role required:** Must be the player the score was submitted for

**Path Parameters:**
| Param | Type |
|---|---|
| `pending_score_id` | UUID |

**Response (HTTP 200):** ScoreResponse of the newly created verified score.

**Notes:**
- Returns HTTP 403 if the current user is not the intended recipient.
- Returns HTTP 409 if the pending score has already been actioned.
- Approval creates a record in the `scores` table with `is_verified=true`.

---

### POST /pending-scores/{pending_score_id}/reject

**Auth required:** Yes
**Role required:** Must be the player the score was submitted for

**Path Parameters:**
| Param | Type |
|---|---|
| `pending_score_id` | UUID |

**Response (HTTP 200):**
```json
{"message": "Score rejected"}
```

**Notes:**
- Returns HTTP 403 if the current user is not the intended recipient.
- Returns HTTP 409 if the pending score has already been actioned.

---

### POST /pending-scores/{pending_score_id}/edit-and-submit

**Auth required:** Yes
**Role required:** Must be the player the score was submitted for

**Path Parameters:**
| Param | Type |
|---|---|
| `pending_score_id` | UUID |

**Request Body:**
| Field | Type | Required | Constraints |
|---|---|---|---|
| `hole_scores` | array | Yes | Exactly 18 items |
| `handicap_override` | float | No | 0.0-54.0 |

**Response (HTTP 200):** ScoreResponse of the newly created verified score (with corrected data).

**Notes:**
- Allows the target player to correct the submitted data before approving.
- Same authorization and idempotency rules as `/approve`.

---

## Leaderboard

### GET /clubs/{club_id}/leaderboard

**Auth required:** Yes
**Role required:** Any authenticated user

**Path Parameters:**
| Param | Type |
|---|---|
| `club_id` | UUID |

**Query Parameters:**
| Param | Type | Default | Constraints |
|---|---|---|---|
| `page` | int | 1 | >= 1 |
| `per_page` | int | 10 | 1-100 |

**Response (HTTP 200):**
```json
{
  "club_id": "uuid",
  "club_name": "Oak Valley Golf Club",
  "entries": [
    {
      "rank": 1,
      "user_id": "uuid",
      "full_name": "Jane Smith",
      "handicap": 12.5,
      "total_stableford_points": 312,
      "total_gross_shots": 1296,
      "rounds_played": 8,
      "best_round_points": 42,
      "last_played": "2026-06-11T10:00:00Z"
    }
  ],
  "total_players": 12,
  "page": 1,
  "per_page": 10,
  "has_more": true
}
```

**Notes:**
- All-time running total — never resets.
- Ordered by `total_stableford_points` DESC; tie-broken by fewer `total_gross_shots`.
- Only verified scores (`is_verified=true`) count.
- Returns HTTP 404 if the club does not exist.

---

### GET /clubs/{club_id}/leaderboard/me

**Auth required:** Yes
**Role required:** Any authenticated user

**Path Parameters:**
| Param | Type |
|---|---|
| `club_id` | UUID |

**Response (HTTP 200):** Single LeaderboardEntry for the current user.

**Notes:**
- Returns HTTP 404 if the user has no verified scores in this club.

---

## Disputes

### POST /scores/{score_id}/dispute

**Auth required:** Yes
**Role required:** Any authenticated user (must be a club member)

**Path Parameters:**
| Param | Type |
|---|---|
| `score_id` | UUID |

**Request Body:**
| Field | Type | Required | Constraints |
|---|---|---|---|
| `reason` | string | Yes | min_length=10, max_length=1000 |

**Response (HTTP 201):**
```json
{
  "id": "uuid",
  "score_id": "uuid",
  "score_owner_name": "Jane Smith",
  "raised_by": "uuid",
  "raised_by_name": "John Doe",
  "reason": "The score entered was incorrect.",
  "status": "open",
  "resolved_by": null,
  "resolved_by_name": null,
  "resolution_notes": null,
  "resolved_at": null,
  "created_at": "2026-06-11T10:00:00Z"
}
```

**Notes:**
- Returns HTTP 404 if the score does not exist.
- Returns HTTP 400 if the score is not verified (`is_verified=false`).
- Returns HTTP 403 if the disputing user is not a member of the club.
- Returns HTTP 409 if the user already has an open dispute for this score.

---

### GET /disputes

**Auth required:** Yes
**Role required:** Admin only

**Response (HTTP 200):** Array of all DisputeResponse objects across all clubs.

**Notes:**
- Returns HTTP 403 for non-admin users.

---

### GET /disputes/mine

**Auth required:** Yes
**Role required:** Any authenticated user

**Response (HTTP 200):** Array of DisputeResponse objects where the current user is either the disputer or the score owner.

---

### POST /disputes/{dispute_id}/resolve

**Auth required:** Yes
**Role required:** Admin only

**Path Parameters:**
| Param | Type |
|---|---|
| `dispute_id` | UUID |

**Request Body:**
| Field | Type | Required | Constraints |
|---|---|---|---|
| `resolution` | string (enum) | Yes | `"resolved"` or `"dismissed"` |
| `resolution_notes` | string | Yes | min_length=10, max_length=1000 |

**Response (HTTP 200):** Updated DisputeResponse with `status`, `resolution_notes`, `resolved_by`, and `resolved_at` populated.

**Notes:**
- Returns HTTP 403 for non-admin users.
- Returns HTTP 409 if the dispute is already resolved or dismissed.

---

## Admin

All admin endpoints require the authenticated user to have `is_admin=true`. Non-admin users receive HTTP 403.

### GET /admin/users

**Auth required:** Yes
**Role required:** Admin only

**Query Parameters:**
| Param | Type | Default |
|---|---|---|
| `search` | string | None |

**Response (HTTP 200):** Array of AdminUserResponse objects.
```json
[
  {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "Jane Smith",
    "handicap": 12.5,
    "is_admin": false,
    "is_active": true,
    "created_at": "2026-06-11T10:00:00Z",
    "clubs_count": 2,
    "scores_count": 15
  }
]
```

**Notes:**
- `search` performs a case-insensitive match against `full_name` and `email`.

---

### PATCH /admin/users/{user_id}

**Auth required:** Yes
**Role required:** Admin only

**Path Parameters:**
| Param | Type |
|---|---|
| `user_id` | UUID |

**Request Body (all optional):**
| Field | Type | Constraints |
|---|---|---|
| `full_name` | string | min_length=1, max_length=255 |
| `handicap` | float | 0.0-54.0 |
| `is_active` | bool | |
| `is_admin` | bool | |

**Response (HTTP 200):** Updated AdminUserResponse.

**Notes:**
- Setting `is_active=false` deactivates the user (soft delete). They cannot log in or access protected endpoints.

---

### GET /admin/clubs

**Auth required:** Yes
**Role required:** Admin only

**Response (HTTP 200):** Array of AdminClubResponse objects.
```json
[
  {
    "id": "uuid",
    "name": "Oak Valley Golf Club",
    "description": "...",
    "location": "Elgin",
    "created_by": "uuid",
    "is_active": true,
    "created_at": "2026-06-11T10:00:00Z",
    "member_count": 12,
    "total_games": 8
  }
]
```

---

### PATCH /admin/clubs/{club_id}

**Auth required:** Yes
**Role required:** Admin only

**Path Parameters:**
| Param | Type |
|---|---|
| `club_id` | UUID |

**Request Body (all optional):**
| Field | Type | Constraints |
|---|---|---|
| `name` | string | min_length=3, max_length=255 |
| `description` | string | |
| `location` | string | |
| `is_active` | bool | |

**Response (HTTP 200):** Updated AdminClubResponse.

---

### DELETE /admin/clubs/{club_id}

**Auth required:** Yes
**Role required:** Admin only

**Path Parameters:**
| Param | Type |
|---|---|
| `club_id` | UUID |

**Response (HTTP 200):** AdminClubResponse with `is_active=false`.

**Notes:**
- This is a **soft delete** — the club is deactivated, not destroyed. All data is preserved.

---

### PATCH /admin/scores/{score_id}

**Auth required:** Yes
**Role required:** Admin only

**Path Parameters:**
| Param | Type |
|---|---|
| `score_id` | UUID |

**Request Body:**
| Field | Type | Required | Constraints |
|---|---|---|---|
| `admin_note` | string | No | min_length=10, max_length=1000. Required for detailed score edits; optional/defaults to `"Quick admin correction"` for fast-edits. |
| `gross_shots` | int | No | >= 0 |
| `stableford_points` | int | No | >= 0 |
| `hole_scores` | array | No | |
| `round_number` | int | No | >= 1 |

**Response (HTTP 200):** ScoreResponse with updated values.

**Notes:**
- `admin_note` is optional for fast score edits (when `hole_scores` is omitted). It is still strictly required (min length 10) if `hole_scores` is provided.
- If `round_number` is provided and different from the current round, the score is reassigned to the game with the new round number (creating a new game with today's date if it doesn't exist).
- If reassignment conflicts with an existing score for the player in that game, returns HTTP 409.
- On save: `admin_edit_note`, `admin_edited_by`, and `admin_edited_at` are populated in the `scores` table.
- Sending `gross_shots: null` explicitly in the request body will clear the stored value of gross shots. Omitting the `gross_shots` key entirely will leave the stored value untouched.

---

### GET /admin/stats

**Auth required:** Yes
**Role required:** Admin only

**Response (HTTP 200):**
```json
{
  "total_users": 45,
  "total_clubs": 8,
  "total_games": 132,
  "total_scores": 847,
  "total_disputes": 12,
  "open_disputes": 3
}
```

---

### GET /admin/scores

**Auth required:** Yes
**Role required:** Admin only

**Query Parameters:**
| Param | Type | Required | Default | Notes |
|---|---|---|---|---|
| `club_id` | UUID | No | NULL | Filter by club |
| `player_id` | UUID | No | NULL | Filter by player. If club_id is omitted, returns scores across all clubs the player belongs to. |
| `include_deleted` | bool | No | `false` | Include soft-deleted scores |
| `page` | int | No | `1` | Pagination page number |
| `per_page` | int | No | `20` | Items per page (max 100) |

**Response (HTTP 200):** AdminScoresListResponse (paginated list of scores with player, game, club details).

**Notes:**
- Soft-deleted scores are excluded by default. Use `include_deleted=true` to view them.
- Each list item includes the joined `round_number`, `club_name`, and `entry_method` fields.

---

### POST /admin/scores

**Auth required:** Yes
**Role required:** Admin only

**Request Body (AdminAddScoreRequest):**
- `player_id` (UUID): ID of the player.
- `club_id` (UUID): ID of the club.
- `game_date` (date): Date of the game.
- `course_name` (string): Name of the course.
- `tee_colour` (string): Tee color (default: "Yellow").
- `notes` (string, optional): Admin notes.
- `handicap` (float): Handicap used (0.0 to 54.0).
- `hole_scores` (array): 18 hole scores.

**Response (HTTP 201):** AdminAddScoreResponse containing `score_id`, `game_id`, `game_created` (bool), `total_points`, `total_gross`, and success message.

**Notes:**
- Auto-detects an existing game played on that date for that club, or creates a new one.
- Bypasses the player approval workflow entirely; the score appears on the leaderboard immediately.

---

### DELETE /admin/scores/{score_id}

**Auth required:** Yes
**Role required:** Admin only

**Path Parameters:**
| Param | Type |
|---|---|
| `score_id` | UUID |

**Request Body (AdminDeleteScoreRequest):**
- `delete_note` (string): Audit trail delete note (min 10, max 500 characters).

**Response (HTTP 200):** `{"message": "Score soft-deleted successfully", "score_id": "<score_uuid>"}`

**Notes:**
- Soft delete only. Sets `deleted_at`, `deleted_by`, and `delete_note`.
- The score is immediately removed from the leaderboard.

---

## Sync

### POST /sync

**Auth required:** Yes
**Role required:** Any authenticated user

**Request Body:**
| Field | Type | Required | Constraints |
|---|---|---|---|
| `items` | array | Yes | max 50 items |
| `items[].game_id` | UUID | No | Client-generated UUID; used to match existing games |
| `items[].club_id` | UUID | Yes | Must be a club the user is a member of |
| `items[].played_on` | date | Yes | ISO date |
| `items[].course_name` | string | No | |
| `items[].tee_colour` | string | No | |
| `items[].hole_scores` | array | Yes | Exactly 18 items |
| `items[].handicap_override` | float | No | 0.0-54.0 |
| `items[].client_timestamp` | datetime | Yes | ISO-8601 UTC; used for last-write-wins conflict check |

**Response (HTTP 200):**
```json
{
  "created_count": 2,
  "updated_count": 1,
  "skipped_count": 0,
  "failed_count": 0,
  "results": [
    {
      "game_id": "uuid",
      "status": "created",
      "reason": null,
      "stableford_points": 36
    }
  ]
}
```

**Status values per item:**
| Status | Meaning |
|---|---|
| `created` | New game and score created |
| `updated` | Existing score updated (client_timestamp newer than server updated_at) |
| `skipped` | Server record is newer — client data discarded (last-write-wins) |
| `failed` | Error processing this item (e.g. club not found, not a member) |

**Notes:**
- Returns HTTP 422 if `items` has more than 50 entries.
- Each item is processed independently — one failure does not abort the batch.
- Conflict resolution is last-write-wins: `client_timestamp` vs `scores.updated_at`.
