# Spec 010: Progress Analytics

**Feature:** `010-progress-analytics`
**Phase:** 4 — Advanced Features
**Status:** Draft
**Date:** 2026-02-23
**Constitution ref:** v1.2.0 § IV (recharts), § V (GET /stats endpoint), § VIII (analytics contract — read-only, live table)

---

## 1. Overview

A `/dashboard` page shows the user's task productivity stats: total/completed/pending counts, completion rate, a weekly completion bar chart, and overdue count. The AI chatbot can answer "how many tasks did I complete this week?" via the `get_stats` MCP tool. All metrics are computed from the live `tasks` table — no separate analytics store.

---

## 2. User Stories

### US1: View productivity dashboard

**As a user**, I want to see a summary of my task progress at a glance.

**Acceptance Criteria:**

| ID | Criterion |
|----|-----------|
| AC1.1 | `/dashboard` page is accessible from the navigation header |
| AC1.2 | Dashboard shows: total tasks, completed, pending, overdue, completion rate (%) |
| AC1.3 | A bar chart shows tasks completed per day for the last 7 days |
| AC1.4 | Stats update on page load (no real-time streaming required) |
| AC1.5 | Dashboard is protected (requires login) |

### US2: Weekly completion bar chart

**As a user**, I want to see how many tasks I completed each day this week.

**Acceptance Criteria:**

| ID | Criterion |
|----|-----------|
| AC2.1 | Chart uses `recharts` BarChart with 7 data points (Mon–today or last 7 days) |
| AC2.2 | X-axis: abbreviated day name; Y-axis: count |
| AC2.3 | Empty days show 0 bar |
| AC2.4 | Chart is responsive (`<ResponsiveContainer width="100%" />`) |

### US3: AI chatbot answers stats questions

**As a user**, I want to ask "how many tasks did I complete this week?" and get a real answer.

**Acceptance Criteria:**

| ID | Criterion |
|----|-----------|
| AC3.1 | `get_stats()` MCP tool returns the same data as `GET /api/{user_id}/stats` |
| AC3.2 | AI formats the response naturally ("You completed 5 tasks this week, with 2 overdue.") |
| AC3.3 | `get_stats` requires no arguments; user_id is from the JWT context |

---

## 3. Out of Scope

- Historical trends beyond 7 days
- Export to CSV / PDF
- Per-tag or per-priority analytics (future amendment)
- Real-time updates (WebSocket / SSE)

---

## 4. API Contract

### GET /api/{user_id}/stats

**Requires:** JWT (user_id in token must match URL param)

**Response:**
```json
{
  "total": 42,
  "completed": 30,
  "pending": 10,
  "overdue": 2,
  "completion_rate": 71.4,
  "weekly": [
    { "date": "2026-02-17", "completed": 3 },
    { "date": "2026-02-18", "completed": 5 },
    { "date": "2026-02-19", "completed": 0 },
    { "date": "2026-02-20", "completed": 2 },
    { "date": "2026-02-21", "completed": 4 },
    { "date": "2026-02-22", "completed": 1 },
    { "date": "2026-02-23", "completed": 2 }
  ]
}
```

### Backend implementation

```python
@router.get("/{user_id}/stats")
def get_user_stats(user_id: str, session: Session = Depends(get_session),
                   current_user: str = Depends(get_current_user)):
    # Enforce user isolation
    # total / completed / pending / overdue counts via SQLModel queries
    # weekly: GROUP BY DATE(updated_at) WHERE completed=true AND updated_at >= now()-7days
    ...
```

No new table — queries run directly against `tasks`.

---

## 5. MCP Tool

```python
def get_stats(session, user_id) -> dict:
    """Return task statistics for the authenticated user."""
    # Returns dict matching the stats response schema (minus 'weekly' list for brevity)
    return {
        "total": ...,
        "completed": ...,
        "pending": ...,
        "overdue": ...,
        "completion_rate": ...,
    }
```

Cohere tool schema:
```json
{
  "name": "get_stats",
  "description": "Returns task productivity statistics for the user: total, completed, pending, overdue counts and completion rate. Use when the user asks about their progress or productivity.",
  "parameters": {}
}
```

---

## 6. Frontend

### New page: `/dashboard`

```tsx
// app/(protected)/dashboard/page.tsx
"use client"
// Fetches /api/{user_id}/stats on mount
// Renders: StatsCards row + WeeklyChart
```

### Components

- `StatsCard` — simple card with label + number (shadcn Card)
- `WeeklyChart` — recharts `BarChart` wrapped in `ResponsiveContainer`
- `DashboardPage` — layout with grid of StatsCards + WeeklyChart below

### Navigation

- Add "Dashboard" link to `header.tsx` and `mobile-nav.tsx` with `BarChart2` lucide icon

### API client addition

```typescript
// lib/api.ts
export async function getStats(userId: string): Promise<StatsResponse>
```

### Type addition

```typescript
// types/index.ts
export interface WeeklyPoint { date: string; completed: number; }
export interface StatsResponse {
  total: number; completed: number; pending: number;
  overdue: number; completion_rate: number;
  weekly: WeeklyPoint[];
}
```

---

## 7. Dependencies

- Frontend: `recharts` — add to `frontend/package.json`
  ```bash
  npm install recharts
  ```
- No backend dependencies added

---

## 8. Constraints

- Stats are computed at query time — no caching layer required for hackathon scope
- `completion_rate` is rounded to one decimal place
- Weekly buckets use UTC dates; display in local timezone via `Intl.DateTimeFormat`
- `recharts` is the only charting library permitted (per constitution § IV)
