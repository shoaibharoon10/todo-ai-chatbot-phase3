# Phase 4 Verification Checklist
**Features:** 005 · 006 · 007 · 008 · 009 · 010 · 011 · 012
**Constitution ref:** v1.2.0 (all sections)
**Date:** 2026-02-23
**Status:** Draft — run manually against a running dev stack

---

## Prerequisites

```bash
# Start backend (port 8000)
cd backend && uvicorn main:app --reload --port 8000

# Start frontend (port 3000)
cd frontend && npm run dev
```

- Register two users: **UserA** and **UserB** (for isolation tests)
- Log in as UserA for all tests unless noted

---

## 005 — Due Dates & Reminders

### UI Tests

| # | Action | Expected |
|---|--------|----------|
| 5.1 | Create task with due date "tomorrow" via the date picker in New Task dialog | Task card shows `DueDateBadge` with formatted date |
| 5.2 | Set a due date → inspect badge color | Past due → red badge; future → amber/green |
| 5.3 | Edit task to remove due date (clear the field) | `DueDateBadge` disappears from card |
| 5.4 | Create task with due date 1 minute in the past | Badge shows overdue styling |
| 5.5 | `GET /api/tasks?overdue=true` | Returns only tasks where `due_date < now AND completed = false` |

### API Tests

```bash
# Create task with due date
curl -X POST http://localhost:8000/api/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test due","due_date":"2026-02-24T00:00:00Z"}'
# Expect: 201, response includes "due_date":"2026-02-24T00:00:00+00:00"

# Overdue filter
curl http://localhost:8000/api/tasks?overdue=true \
  -H "Authorization: Bearer $TOKEN"
# Expect: only overdue tasks; no completed tasks in result
```

### AI Chat Tests

```
"add task: buy groceries, due tomorrow"
→ Cohere calls add_task(title="buy groceries", due_date="<tomorrow ISO>")
→ confirm: task created with due_date populated

"show me my overdue tasks"
→ Cohere calls list_tasks(overdue=true) or get_stats()
→ confirm: response mentions overdue count
```

### Constitution Compliance

- [x] Due dates stored as UTC ISO 8601 (`timezone.utc` in SQLModel) — § V
- [x] Frontend displays in local timezone via `Intl.DateTimeFormat` — § VIII
- [x] `due_date` column is nullable; no data loss for existing tasks — § VIII (additive only)
- [x] `?overdue=true` filter on `GET /api/tasks` — § V

---

## 006 — Custom Notifications (Browser Push)

### UI Tests

| # | Action | Expected |
|---|--------|----------|
| 6.1 | Click notification permission button → grant | Button changes to "Notifications On" or disappears |
| 6.2 | Deny notification permission | Button shows "Enable Notifications" or warning state |
| 6.3 | Create task due in < 1 minute (set exact time) | Browser notification fires within 60 seconds |
| 6.4 | Toggle task complete → notification dismissed (no notification for completed task) | No notification fires after completion |
| 6.5 | Refresh page while notifications are on | Permission state persists (localStorage/Notification.permission) |

### Constitution Compliance

- [x] Uses native **Notification API** — no third-party push SDK — § IV
- [x] Browser-local: no server-side subscription storage — § VIII (browser-local rule)
- [x] `NEXT_PUBLIC_VAPID_PUBLIC_KEY` optional env var — § VIII
- [x] `"use client"` directive on notification components — § IV

---

## 007 — Priorities

### UI Tests

| # | Action | Expected |
|---|--------|----------|
| 7.1 | Create task with priority "urgent" | Card shows red `PriorityBadge`; "medium" tasks show no badge |
| 7.2 | Edit task priority from "low" to "high" | Badge updates; task list reflects new sort order |
| 7.3 | Filter tasks by priority "urgent" in TaskFilters | Only urgent tasks shown |
| 7.4 | Sort — verify priority sort order in task list | urgent → high → medium → low (CASE sort via sa_case) |
| 7.5 | Create task without specifying priority | Defaults to `medium`; no badge shown |

### API Tests

```bash
# Invalid priority → 422
curl -X POST http://localhost:8000/api/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"test","priority":"extreme"}'
# Expect: 422 Unprocessable Entity

# Priority filter
curl "http://localhost:8000/api/tasks?priority=urgent" \
  -H "Authorization: Bearer $TOKEN"
# Expect: only tasks with priority="urgent"
```

### AI Chat Tests

```
"add urgent task: fix production bug"
→ Cohere calls add_task(title="fix production bug", priority="urgent")
→ confirm: red badge on task card

"mark task 3 as high priority"
→ Cohere calls update_task(task_id=3, priority="high")
→ confirm: task 3 priority changed

"show me my high priority tasks"
→ Cohere calls list_tasks(priority="high")
→ confirm: only high priority tasks in response
```

### Constitution Compliance

- [x] Valid values: `low | medium | high | urgent`; default `medium` — § VIII
- [x] Invalid values return 422 (Pydantic `PriorityLiteral` validation) — § VIII
- [x] Priority stored in DB as VARCHAR(10) with default 'medium' — § V
- [x] Priority index `ix_tasks_priority` created — § V

---

## 008 — Tags

### UI Tests

| # | Action | Expected |
|---|--------|----------|
| 8.1 | Open "New Task" → click Tags field → type "work" → select/create | Tag chip appears in dialog |
| 8.2 | Submit task with tags | Tags appear as colored chips on task card |
| 8.3 | Create same tag name twice | Idempotent: second create returns existing tag, no duplicate |
| 8.4 | Filter tasks by tag in TaskFilters dropdown | Only tasks with that tag shown |
| 8.5 | Delete a tag via `DELETE /api/{user_id}/tags/{tag_id}` | Tag chips disappear from task cards (via CASCADE) |
| 8.6 | Delete a task with tags | `task_tags` rows CASCADE deleted; no orphaned rows |

### API Tests

```bash
# Create tag
curl -X POST http://localhost:8000/api/$USER_ID/tags \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"work","color":"#4f46e5"}'
# Expect: 201, {"id":1,"name":"work","color":"#4f46e5"}

# Duplicate tag (idempotent)
curl -X POST http://localhost:8000/api/$USER_ID/tags \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"work","color":"#ff0000"}'
# Expect: 200 or 201, returns SAME id as above (not a new row)

# List tags
curl http://localhost:8000/api/$USER_ID/tags \
  -H "Authorization: Bearer $TOKEN"
# Expect: array of tags belonging to current user only

# 403: wrong user_id
curl http://localhost:8000/api/wrong-user-id/tags \
  -H "Authorization: Bearer $TOKEN"
# Expect: 403 Forbidden
```

### AI Chat Tests

```
"add task: design mockup with tag design"
→ Cohere calls add_task(title="design mockup", tags=["design"])
→ confirm: task created with design tag chip visible

"tag task 5 as urgent"
→ Cohere calls tag_task(task_id=5, tag_name="urgent")
→ confirm: "urgent" tag chip appears on task 5

"create a tag called shopping with green color"
→ Cohere calls add_tag(name="shopping", color="#22c55e")
→ confirm: tag created in DB
```

### User Isolation

```bash
# UserB should not see UserA's tags
TOKEN_B="<UserB JWT>"
curl http://localhost:8000/api/$USER_A_ID/tags \
  -H "Authorization: Bearer $TOKEN_B"
# Expect: 403 Forbidden
```

### Constitution Compliance

- [x] Tags unique per user by name (UniqueConstraint on `(user_id, name)`) — § VIII
- [x] Duplicate tag creation is idempotent — § VIII
- [x] Tag isolation by `user_id` on all queries — § II
- [x] Dynamic hex colors use inline `style=` on `TagChip` (justified exception for runtime values)

---

## 009 — Recurring Tasks

### UI Tests

| # | Action | Expected |
|---|--------|----------|
| 9.1 | Create task with "Every day" recurrence + a due date | `RecurrenceBadge` visible; `recurrence_rule: FREQ=DAILY` in DB |
| 9.2 | Toggle recurring task as complete | Original task marked done; **new task created** with next due date |
| 9.3 | New occurrence inherits recurrence_rule and priority | Check task card of new occurrence |
| 9.4 | Create "every weekday" task | RRULE: `FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR` |
| 9.5 | Complete weekday task due Monday | Next occurrence due next Tuesday |
| 9.6 | Non-recurring task toggle | No new occurrence created; no `RecurrenceBadge` |

### API Tests

```bash
# Create recurring task
curl -X POST http://localhost:8000/api/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"daily standup","recurrence_rule":"FREQ=DAILY","due_date":"2026-02-24T09:00:00Z"}'

# Toggle — expect next_occurrence in response
curl -X PATCH http://localhost:8000/api/tasks/$TASK_ID/complete \
  -H "Authorization: Bearer $TOKEN"
# Expect: completed=true + next_occurrence object with due_date = 2026-02-25T09:00:00Z

# Invalid RRULE → 422
curl -X POST http://localhost:8000/api/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"bad","recurrence_rule":"NOTARRULE"}'
# Expect: 422 or error dict from tool
```

### AI Chat Tests

```
"add daily standup every weekday at 9am"
→ Cohere calls add_task(title="daily standup", recurrence_rule="FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR", due_date="<next weekday 09:00 UTC>")
→ confirm: RecurrenceBadge on task card

"mark task 7 as done"  (task 7 is recurring)
→ Cohere calls complete_task(task_id=7)
→ confirm: original done + toast "Recurring task done — next due <date>"
```

### Constitution Compliance

- [x] `python-rrule` used for RRULE parsing + next-date calculation — § IV, § VIII
- [x] No manual date arithmetic — § VIII (recurrence contract)
- [x] New occurrence inherits `recurrence_rule` from parent — § VIII
- [x] `recurrence_parent_id` links new occurrence to original — § V

---

## 010 — Progress Analytics

### UI Tests

| # | Action | Expected |
|---|--------|----------|
| 10.1 | Click "Dashboard" nav link | `/dashboard` loads with 4 stat cards + completion rate + bar chart |
| 10.2 | Complete 3 tasks then reload dashboard | Completed count = 3; completion rate updates |
| 10.3 | Dashboard with 0 tasks | `completion_rate: 0.0`; no division error; chart shows 7 zero bars |
| 10.4 | Chart bars | 7 bars for last 7 days; x-axis shows weekday short names (Mon, Tue...) |
| 10.5 | Overdue card | Count matches `GET /api/{user_id}/stats` overdue field |
| 10.6 | Loading state | 3-dot bounce spinner shown while fetching |
| 10.7 | Dashboard nav active state | Dashboard link highlighted when on `/dashboard` |

### API Tests

```bash
curl http://localhost:8000/api/$USER_ID/stats \
  -H "Authorization: Bearer $TOKEN"
# Expect:
# {
#   "total": N, "completed": N, "pending": N, "overdue": N,
#   "completion_rate": 0.0..100.0,
#   "weekly": [{"date":"2026-02-17","completed":0}, ... 7 items]
# }

# 403 test
curl http://localhost:8000/api/wrong-user/stats \
  -H "Authorization: Bearer $TOKEN"
# Expect: 403
```

### AI Chat Tests

```
"how many tasks have I completed?"
→ Cohere calls get_stats()
→ confirm: natural language response with completed count

"am I being productive this week?"
→ Cohere calls get_stats()
→ confirm: response references completion_rate

"how many overdue tasks do I have?"
→ Cohere calls get_stats()
→ confirm: response mentions overdue count
```

### Constitution Compliance

- [x] `/api/{user_id}/stats` is read-only — § VIII (analytics contract)
- [x] Computes from live `tasks` table; no separate analytics table — § VIII
- [x] Weekly array always has exactly 7 items — § VIII
- [x] `recharts` used for BarChart; no D3, Chart.js — § IV
- [x] `"use client"` on `WeeklyChart` (recharts requires browser) — § IV

---

## 011 — Offline PWA

### UI Tests

| # | Action | Expected |
|---|--------|----------|
| 11.1 | Open `/tasks` while online | Tasks load normally; no offline banner |
| 11.2 | DevTools → Network → Offline → reload `/tasks` | Cached task list shown; "Offline — showing cached data" amber banner |
| 11.3 | DevTools → Network → Offline → toggle a task | Amber toast "Saved offline — will sync when connected" |
| 11.4 | Go back online (toggle network) | Sync toast "Synced 1 change"; task refreshed from server |
| 11.5 | DevTools → Network → Offline → create new task | Task queued; "Saved offline" toast; dialog closes |
| 11.6 | Go online | Queued create flushed; task appears in list |
| 11.7 | DevTools → Network → Offline → delete task | "Queued for deletion" toast; task removed from UI |
| 11.8 | Header offline indicator | Amber "Offline" pill appears when network disabled |
| 11.9 | `GET /manifest.json` in browser | 200 response; valid JSON with name, icons, theme_color |
| 11.10 | DevTools → Application → Manifest | No errors; icons, start_url, display:standalone shown |
| 11.11 | DevTools → Application → Service Workers (prod build) | SW registered; workbox script loaded |

### Constitution Compliance

- [x] `idb-keyval` used for IndexedDB; no localStorage for structured task data — § IV, § VIII
- [x] Write operations queued offline, flushed on reconnect — § VIII (offline-first contract)
- [x] All idb-keyval calls inside `"use client"` components — § IV
- [x] `next-pwa` with NetworkFirst for `/api/*` routes — § IV
- [x] SW disabled in development mode — spec § 8
- [x] Per-user cache keys (`tasks:{userId}`, `queue:{userId}`) — § II (user isolation)
- [x] Last-write-wins conflict resolution (documented in ADR-001) — § VIII

---

## 012 — Task Notes

### UI Tests

| # | Action | Expected |
|---|--------|----------|
| 12.1 | Open "New Task" → click "+ Add Notes" | Notes textarea appears; "Remove Notes" link shown |
| 12.2 | Click "Remove Notes" | Textarea hidden; notes cleared |
| 12.3 | Create task with notes | Task card shows `FileText` icon in header |
| 12.4 | Click "Notes" toggle on task card | Notes text expands; line breaks preserved (`whitespace-pre-wrap`) |
| 12.5 | Click again | Notes collapse |
| 12.6 | Edit task with notes | Notes pre-populated in edit dialog textarea |
| 12.7 | Clear notes in edit dialog → save | `notes: null`; FileText icon gone from card |
| 12.8 | Task without notes | No FileText icon; no "Notes" toggle |
| 12.9 | Notes with 5000+ chars | API returns 422 (Pydantic max_length=5000) |

### API Tests

```bash
# Create task with notes
curl -X POST http://localhost:8000/api/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"with notes","notes":"remember to call at 3pm"}'
# Expect: 201, response includes "notes":"remember to call at 3pm"

# Clear notes
curl -X PUT http://localhost:8000/api/tasks/$TASK_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"notes":null}'
# Expect: 200, "notes":null

# max_length violation → 422
python3 -c "print('x'*5001)" | xargs -I{} curl -X POST http://localhost:8000/api/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"test\",\"notes\":\"$(python3 -c 'print(\"x\"*5001)')\"}"
# Expect: 422
```

### AI Chat Tests

```
"add task: project review with note: bring Q4 report and laptop charger"
→ Cohere calls add_task(title="project review", notes="bring Q4 report and laptop charger")
→ confirm: FileText icon on task card; notes expand correctly

"add a note to task 5: call client at 3pm"
→ Cohere calls update_task(task_id=5, notes="call client at 3pm")
→ confirm: notes added to task 5

"clear the notes on task 3"
→ Cohere calls update_task(task_id=3, clear_notes=true)
→ confirm: task 3 notes=null; FileText icon gone

"what are the notes on task 5?"
→ Cohere calls list_tasks() or update_task to retrieve
→ confirm: assistant reads notes from get_stats or describes the note
```

### Constitution Compliance

- [x] Notes stored as TEXT (nullable) in PostgreSQL — § V
- [x] No file storage — plain text only — § VIII
- [x] Additive migration (`ADD COLUMN IF NOT EXISTS notes TEXT`) — § VIII
- [x] `whitespace-pre-wrap` for multi-line display — § IV (Tailwind only)
- [x] No Markdown rendering — § VIII (plain text only)

---

## Cross-Feature: User Isolation (§ II)

| # | Test | Expected |
|---|------|----------|
| ISO.1 | UserA creates tasks; UserB logs in and calls `GET /api/tasks` | UserB sees only their own tasks |
| ISO.2 | UserB calls `GET /api/userA_id/stats` | 403 Forbidden |
| ISO.3 | UserB calls `GET /api/userA_id/tags` | 403 Forbidden |
| ISO.4 | UserB's chat: "list all tasks" | Only UserB's tasks returned via `list_tasks` tool |
| ISO.5 | UserB calls `DELETE /api/tasks/<userA_task_id>` | 404 (task not found for UserB's JWT) |
| ISO.6 | UserA's IndexedDB cache | Keys `tasks:{userA_id}` — not accessible via UserB session |

---

## Cross-Feature: AI Chat NL Commands (§ VII)

All Cohere NL parsing tests — run via the `/chat` UI or `POST /api/{user_id}/chat`:

```
# Complex compound command
"add recurring daily task due tomorrow with high priority and tag work: morning standup"
→ add_task(title="morning standup", due_date="<tomorrow ISO>",
           recurrence_rule="FREQ=DAILY", priority="high", tags=["work"])
→ confirm: all 4 fields populated correctly in DB

# Multi-step chain
"create tag 'client' in blue, then tag task 3 with it"
→ Step 1: add_tag(name="client", color="#3b82f6")
→ Step 2: tag_task(task_id=3, tag_name="client")
→ confirm: Cohere executes both tool calls in sequence

# Analytics query
"give me a summary of my productivity"
→ get_stats()
→ confirm: natural language summary with total/completed/overdue/rate

# Notes via chat
"add task: client call, notes: ask about Q4 budget and timeline"
→ add_task(title="client call", notes="ask about Q4 budget and timeline")

# Priority + due date
"urgent: submit tax forms by end of month"
→ add_task(title="submit tax forms", priority="urgent",
           due_date="<2026-02-28T23:59:59Z>")

# Recurrence + tag
"add weekly review every Monday with tag personal"
→ add_task(title="weekly review", recurrence_rule="FREQ=WEEKLY;BYDAY=MO",
           tags=["personal"])

# Tool persistence check
"add task: buy milk"  →  verify task appears in /tasks UI (not just AI response)
```

---

## Cross-Feature: JWT Auth (§ III)

```bash
# No token → 401
curl http://localhost:8000/api/tasks
# Expect: 401

# Expired token → 401
curl http://localhost:8000/api/tasks \
  -H "Authorization: Bearer <expired-jwt>"
# Expect: 401

# Valid token → 200
curl http://localhost:8000/api/tasks \
  -H "Authorization: Bearer $TOKEN"
# Expect: 200 array
```

---

## Constitution Compliance Summary

| Principle | Check | Status |
|-----------|-------|--------|
| § I — Spec-First | All features have spec.md → plan.md → tasks.md → PHR | ✅ |
| § II — User Isolation | All Phase 4 endpoints enforce JWT sub = URL user_id | ✅ |
| § III — Stateless JWT | No server-side sessions; PyJWT verify on every request | ✅ |
| § IV — Immutable Stack | recharts ✅, idb-keyval ✅, next-pwa ✅, python-rrule ✅ | ✅ |
| § IV — No OpenAI | Only `cohere` package used | ✅ |
| § IV — No localStorage for tasks | idb-keyval used for structured data | ✅ |
| § IV — Notification API | Native `Notification` API, no third-party SDK | ✅ |
| § V — API-First | All Phase 4 endpoints documented and implemented | ✅ |
| § VI — Error handling | HTTPException on backend; toast on frontend | ✅ |
| § VII — Cohere NLU | All date/priority/tag/recurrence parsing via Cohere | ✅ |
| § VII — Tools persist to DB | All tool calls write to Neon PostgreSQL | ✅ |
| § VIII — Additive only | No columns removed; all additions nullable/default | ✅ |
| § VIII — Browser-local | Notifications + offline cache in browser only | ✅ |
| § VIII — Offline-first | Read cache + write queue + flush on reconnect | ✅ |
| § VIII — Recurrence | python-rrule for next-date; no manual arithmetic | ✅ |
| § VIII — Analytics read-only | /stats computes from live tasks table | ✅ |
| § VIII — Tag uniqueness | UniqueConstraint (user_id, name); idempotent create | ✅ |
| § VIII — Priority enum | Literal["low","medium","high","urgent"]; 422 on invalid | ✅ |
| § VIII — Due date UTC | All stored as UTC; displayed in local TZ via Intl | ✅ |

---

## Known Gaps / Debug Prompts

If any test fails, use these targeted fix prompts:

```
# If recurring tasks don't create next occurrence:
"Debug: complete_task in task_tools.py is not creating next occurrence — check python-rrule import and compute_next_occurrence call"

# If offline cache doesn't populate:
"Debug: task-cache.ts cacheTasksForUser not writing to IndexedDB — check idb-keyval 'set' call is inside useClient context"

# If write queue flush loop triggers repeatedly:
"Debug: flushQueue effect running on every render — investigate useEffect deps [online, userId] and ensure executeQueuedAction is stable via useCallback"

# If tag filter returns all tasks:
"Debug: GET /api/tasks?tag=X not filtering — check task_tags JOIN in routes/tasks.py enrich_task_with_tags"

# If dashboard shows NaN for completion_rate:
"Debug: StatsResponse completion_rate field — backend returns float, frontend type is number — check Pydantic serialization"

# If next-pwa breaks dev builds:
"Debug: next.config.ts withPWA — verify disable: process.env.NODE_ENV === 'development' is set correctly"

# If notes not pre-populating in edit dialog:
"Debug: TaskEditDialog useEffect — check task.notes property is included in TaskRead schema and API response"
```

---

*Generated by Claude Code · Phase 4 Verification · 2026-02-23*
