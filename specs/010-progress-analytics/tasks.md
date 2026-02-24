# Tasks 010: Progress Analytics

**Feature:** `010-progress-analytics`
**Plan:** `specs/010-progress-analytics/plan.md`
**Constitution ref:** v1.2.0 § IV (recharts only), § V (GET /stats read-only), § VIII (analytics from live tasks table)
**Date:** 2026-02-23
**Total tasks:** 13

---

## Phase 1 — Backend: Models

### T001 — Add `StatsResponse` and `WeeklyPoint` Pydantic models
**File:** `backend/models.py`
**Const. ref:** § V (GET /api/{user_id}/stats response contract)

- [x] Add `WeeklyPoint(BaseModel)`: `date: str`, `completed: int`
- [x] Add `StatsResponse(BaseModel)`: total, completed, pending, overdue, completion_rate, weekly
- [x] Verify: TypeScript types will match (via serialization)

---

## Phase 2 — Backend: Stats Endpoint

### T002 — Create `backend/routes/stats.py`
**Const. ref:** § V (GET /api/{user_id}/stats), § II (user isolation — 403 if user_id mismatch), § VIII (analytics contract: read-only, live table)

- [x] New file with `router = APIRouter(prefix="/api")`
- [x] `GET /{user_id}/stats` endpoint with 403 guard
- [x] Compute total, completed, pending, overdue (graceful getattr for due_date)
- [x] Compute `completion_rate = round(completed / total * 100, 1) if total else 0.0`
- [x] Compute `weekly`: 7 entries for last 7 days (today-6 to today, UTC)
- [x] Verify: `GET /api/{user_id}/stats` returns all 6 keys; `weekly` has exactly 7 items
- [x] Verify: 403 if URL user_id ≠ JWT sub

### T003 — Register stats router in `main.py`
**File:** `backend/main.py`

- [x] Import `stats_router` from `routes.stats`
- [x] `app.include_router(stats_router)`
- [x] Verify: `GET /api/{user_id}/stats` returns 200

---

## Phase 3 — Backend: MCP Tool

### T004 — Add `get_stats` tool to `task_tools.py`
**File:** `backend/tools/task_tools.py`
**Const. ref:** § VII (MCP tool — thin wrapper; result as string dict for Cohere document format)

- [x] Add `get_stats(session, user_id) -> dict` with all values as strings
- [x] Compute total, completed, pending, overdue, completion_rate
- [x] All values as strings (Cohere document format requirement)
- [x] Verify: returns correct counts matching the API endpoint

### T005 — Register `get_stats` in Cohere tool catalogue
**File:** `backend/routes/chat.py`
**Const. ref:** § VII (TOOLS list; tool-call dispatch loop)

- [x] Import `get_stats` from `tools.task_tools`
- [x] Add `get_stats` to TOOLS list (no parameters, description for productivity queries)
- [x] Add `"get_stats": get_stats` to TOOL_DISPATCH
- [x] Verify: "how many tasks have I completed?" → Cohere calls `get_stats` → natural language response

---

## Phase 4 — Frontend: Dependencies

### T006 — Install `recharts`
**Const. ref:** § IV (recharts only; no Chart.js, D3, or alternatives)

- [x] `cd frontend && npm install recharts`
- [x] Added to `frontend/package.json` dependencies
- [x] Verify: TypeScript resolves `from "recharts"` imports without errors

---

## Phase 5 — Frontend: Types & API

### T007 — Add `StatsResponse` and `WeeklyPoint` to TypeScript types
**File:** `frontend/src/types/index.ts`

- [x] Add `WeeklyPoint`: `{ date: string; completed: number; }`
- [x] Add `StatsResponse`: total, completed, pending, overdue, completion_rate, weekly
- [x] Verify: TypeScript 0 errors

### T008 — Add `getStats` function to API client
**File:** `frontend/src/lib/api.ts`

- [x] Add `getStats(userId: string): Promise<StatsResponse>` → `GET /api/{userId}/stats`
- [x] Verify: TypeScript 0 errors

---

## Phase 6 — Frontend: Components

### T009 — Create `StatsCard` component
**File:** `frontend/src/components/features/dashboard/stats-card.tsx` *(new file + new dir)*
**Const. ref:** § IV (shadcn/ui Card; Tailwind only)

- [x] Created `components/features/dashboard/` directory
- [x] Props: `label`, `value`, `suffix?`, `colorClass?`
- [x] Renders shadcn Card with large value + optional suffix, small label below
- [x] Verify: renders without errors

### T010 — Create `WeeklyChart` component
**File:** `frontend/src/components/features/dashboard/weekly-chart.tsx` *(new file)*
**Const. ref:** § IV (recharts only; `"use client"` required for browser chart rendering)

- [x] `"use client"` directive
- [x] Imports: BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer from recharts
- [x] Props: `data: WeeklyPoint[]`
- [x] X-axis label formatted as weekday short name via Intl.DateTimeFormat
- [x] Wrapped in `<ResponsiveContainer width="100%" height={200}>`
- [x] Bar fill: `#4f46e5` (indigo-600), radius [4,4,0,0]
- [x] Verify: renders chart with 7 bars; empty days show 0 bar (not missing)

### T011 — Create `/dashboard` page
**File:** `frontend/src/app/(protected)/dashboard/page.tsx` *(new file)*
**Const. ref:** § III (JWT required; protected route), § V (GET /stats endpoint)

- [x] `"use client"` directive
- [x] Reads `userId` from `authClient.useSession()`
- [x] `useEffect`: calls `getStats(userId)` → stores in state
- [x] Loading state: 3-dot bounce spinner (matching chat-container pattern)
- [x] Layout: 4 StatsCards (Total, Completed, Pending, Overdue) in `grid-cols-2 md:grid-cols-4`
- [x] Completion rate in 5th standalone StatsCard
- [x] `<WeeklyChart data={stats.weekly} />` below cards
- [x] Verify: page loads; shows real data; responsive layout works

### T012 — Add "Dashboard" nav links to header and mobile nav
**Files:** `frontend/src/components/features/layout/header.tsx`, `mobile-nav.tsx`

- [x] Added Dashboard link (with `BarChart2` icon) after Tasks, before Chat in `header.tsx`
- [x] Added Dashboard link (with `BarChart2` icon) in `mobile-nav.tsx`
- [x] Active state highlights Dashboard link when on `/dashboard`
- [x] Verify: Dashboard link navigates to `/dashboard`; active state works

---

## Phase 7 — End-to-End Testing

### T013 — Verify analytics end-to-end
**Const. ref:** § VI (all errors handled; chatbot tool results accurate)

| Check | Expected |
|-------|----------|
| `GET /api/{user_id}/stats` with tasks | All 6 fields present; `weekly` has 7 items |
| Stats with 0 tasks | `completion_rate: 0.0`; no division error |
| 403 with wrong user_id | Correct isolation enforced |
| Dashboard page loads | Real data; no hydration error |
| Chart with 0 completions today | Bar at 0 (not missing from chart) |
| Chat: "how productive have I been?" | `get_stats` called; natural response |
| `recharts` SSR | No hydration error (`"use client"` guard) |
| Navigation: Dashboard link | Appears in header and mobile nav |
| TypeScript diagnostics | 0 errors |
