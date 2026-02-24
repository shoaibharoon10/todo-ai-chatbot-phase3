# Plan 010: Progress Analytics

**Feature:** `010-progress-analytics`
**Spec:** `specs/010-progress-analytics/spec.md`
**Constitution ref:** v1.2.0 § IV (recharts only), § V (GET /stats, read-only), § VIII (analytics contract — live table, no analytics store)
**Status:** Draft
**Date:** 2026-02-23

---

## Architectural Overview

Analytics are computed on-the-fly from the `tasks` table via a dedicated `GET /api/{user_id}/stats` endpoint. No analytics table, no materialized views, no background jobs. A new `/dashboard` page renders four summary stat cards and one `recharts` BarChart showing the 7-day completion trend. The `get_stats` MCP tool exposes the same data to the AI chatbot.

### Key decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Analytics source | Live `tasks` table queries | Constitution § VIII — no separate analytics store |
| Weekly buckets | UTC date grouping in SQL | Consistent with backend UTC date storage |
| Chart library | `recharts` only | Constitution § IV lockdown |
| Caching | None (query-time compute) | Hackathon scope; query is fast for single-user task counts |

---

## Phases

### Phase 1 — Backend: Stats Endpoint

**Goal:** Implement `GET /api/{user_id}/stats` returning counts + weekly trend.

**New file:** `backend/routes/stats.py`

```python
from datetime import datetime, timezone, timedelta
from sqlmodel import Session, select, func
from fastapi import APIRouter, Depends, HTTPException
from models import Task, StatsResponse, WeeklyPoint
from auth import get_current_user
from db import get_session

router = APIRouter(prefix="/api")

@router.get("/{user_id}/stats", response_model=StatsResponse)
def get_stats(user_id: str, session: Session = Depends(get_session),
              current_user: str = Depends(get_current_user)):
    if current_user != user_id:
        raise HTTPException(status_code=403)

    now = datetime.now(timezone.utc)
    tasks = session.exec(select(Task).where(Task.user_id == user_id)).all()

    total = len(tasks)
    completed = sum(1 for t in tasks if t.completed)
    pending = total - completed
    overdue = sum(
        1 for t in tasks
        if not t.completed and t.due_date and t.due_date < now
    )
    rate = round((completed / total * 100), 1) if total else 0.0

    # Weekly buckets: last 7 calendar days (UTC)
    seven_days_ago = (now - timedelta(days=6)).date()
    weekly: list[WeeklyPoint] = []
    for i in range(7):
        day = (now - timedelta(days=6 - i)).date()
        count = sum(
            1 for t in tasks
            if t.completed and t.updated_at and t.updated_at.date() == day
        )
        weekly.append(WeeklyPoint(date=str(day), completed=count))

    return StatsResponse(
        total=total, completed=completed, pending=pending,
        overdue=overdue, completion_rate=rate, weekly=weekly,
    )
```

**Files to modify:**
- `backend/models.py` — add `StatsResponse`, `WeeklyPoint` Pydantic models
- `backend/routes/stats.py` (new)
- `backend/main.py` — register `stats_router`

**Acceptance checks:**
- [ ] `GET /api/{user_id}/stats` returns correct counts
- [ ] `overdue` count only includes incomplete tasks with past `due_date`
- [ ] `weekly` has exactly 7 entries in ascending date order
- [ ] 403 if URL `user_id` ≠ JWT `sub`

---

### Phase 2 — Backend: `get_stats` MCP Tool

**Goal:** Expose stats to the AI chatbot.

**Files to modify:**
- `backend/tools/task_tools.py` — add `get_stats(session, user_id) -> dict`

```python
def get_stats(session, user_id) -> dict:
    """Return task statistics summary (without weekly breakdown for brevity)."""
    now = datetime.now(timezone.utc)
    tasks = session.exec(select(Task).where(Task.user_id == user_id)).all()
    total = len(tasks)
    completed = sum(1 for t in tasks if t.completed)
    overdue = sum(1 for t in tasks if not t.completed and t.due_date and t.due_date < now)
    rate = round(completed / total * 100, 1) if total else 0.0
    return {
        "total": str(total),
        "completed": str(completed),
        "pending": str(total - completed),
        "overdue": str(overdue),
        "completion_rate": str(rate),
    }
```

**Cohere tool schema** (`backend/routes/chat.py`):
```json
{
  "name": "get_stats",
  "description": "Returns the user's task statistics: total tasks, completed, pending, overdue count, and completion rate percentage. Use when asked about progress, productivity, or task counts.",
  "parameters": {}
}
```

**Files to modify:**
- `backend/tools/task_tools.py`
- `backend/routes/chat.py` — add `get_stats` to TOOLS list and import/dispatch

**Acceptance checks:**
- [ ] `get_stats` returns dict with all 5 keys as strings (Cohere document format)
- [ ] AI responds naturally to "how productive have I been this week?"

---

### Phase 3 — Frontend: Types + API Client

**Files to modify:**
- `frontend/src/types/index.ts` — add `WeeklyPoint`, `StatsResponse` interfaces
- `frontend/src/lib/api.ts` — add `getStats(userId: string): Promise<StatsResponse>`

```typescript
export async function getStats(userId: string): Promise<StatsResponse> {
  return request<StatsResponse>(`/api/${userId}/stats`);
}
```

---

### Phase 4 — Frontend: Dashboard Page + Components

**New files:**
- `frontend/src/app/(protected)/dashboard/page.tsx`
- `frontend/src/components/features/dashboard/stats-card.tsx`
- `frontend/src/components/features/dashboard/weekly-chart.tsx`

**`StatsCard` component:**
```tsx
interface StatsCardProps { label: string; value: number | string; suffix?: string; colorClass?: string; }
// Renders shadcn Card with a large number + label
```

**`WeeklyChart` component:**
```tsx
"use client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
// data: WeeklyPoint[] — format date as short weekday name
const formatDate = (d: string) => new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(new Date(d));
```

**`DashboardPage`:**
```tsx
"use client";
// Fetch getStats(userId) on mount
// Render 4 StatsCards in a responsive grid (grid-cols-2 md:grid-cols-4)
// Render WeeklyChart below
```

**Navigation update:**
- `frontend/src/components/features/layout/header.tsx` — add "Dashboard" nav link with `BarChart2` icon
- `frontend/src/components/features/layout/mobile-nav.tsx` — add Dashboard mobile link

**Acceptance checks:**
- [ ] `/dashboard` page loads and shows real data
- [ ] Stats cards show: Total, Completed, Pending, Overdue
- [ ] Completion rate shown as "71.4%"
- [ ] Bar chart has 7 bars; today's bar reflects actual completions
- [ ] Responsive: 2-column mobile, 4-column desktop stat cards
- [ ] TypeScript: 0 errors

---

### Phase 5 — Dependency Installation

```bash
cd frontend && npm install recharts
```

**Acceptance checks:**
- [ ] `recharts` in `frontend/package.json` dependencies
- [ ] No TypeScript errors from recharts imports

---

### Phase 6 — Cohere Integration Verification

**Test prompts:**
- "how many tasks have I completed?" → `get_stats()` → AI responds with completed count
- "what's my completion rate?" → `get_stats()` → AI quotes percentage
- "how many overdue tasks do I have?" → `get_stats()` → AI quotes overdue count

---

### Phase 7 — Testing

| Test | Expected |
|------|----------|
| `GET /api/{user_id}/stats` | All 5 keys present; `weekly` has 7 items |
| Stats with 0 tasks | `completion_rate: 0.0`; no division error |
| 403 on wrong user_id | Correct isolation |
| Dashboard page load | Real data renders; no hydration error |
| Bar chart with 0 completions | All bars at 0 (not missing) |
| NL: "how productive am I?" | AI calls `get_stats` and responds naturally |
| TypeScript diagnostics | 0 errors |

---

## Risks & Mitigations

| Risk | Blast radius | Mitigation |
|------|-------------|------------|
| `recharts` SSR incompatibility | Hydration error | `"use client"` on `WeeklyChart`; `dynamic` import with `ssr:false` if needed |
| `due_date` not yet implemented (spec 005) | `overdue` count always 0 | Graceful: `t.due_date` check with `getattr` default; still works |
| Large task list → slow stats | Sluggish dashboard | Acceptable for hackathon; add LIMIT/index hint if needed |
