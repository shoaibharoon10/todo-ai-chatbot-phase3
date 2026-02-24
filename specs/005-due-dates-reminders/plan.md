# Plan 005: Due Dates & Reminders

**Feature:** `005-due-dates-reminders`
**Spec:** `specs/005-due-dates-reminders/spec.md`
**Constitution ref:** v1.2.0 § V (schema), § VII (MCP), § VIII (due date format = UTC ISO 8601)
**Status:** Draft
**Date:** 2026-02-23

---

## Architectural Overview

Due dates are stored as timezone-aware UTC timestamps on the `tasks` table. A single additive column (`due_date`) is added via an `ALTER TABLE` statement executed in the backend lifespan. No separate migration tool (Alembic) is needed for this hackathon scope — `create_all` only creates missing objects; `ALTER TABLE` is idempotent when wrapped in a try/except. Display conversion to local timezone is handled entirely in the browser using `Intl.DateTimeFormat`.

### Key decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Date storage | UTC `TIMESTAMP WITH TIME ZONE` | Constitution § VIII mandate; avoids timezone bugs |
| Date parsing (NL) | Cohere model | Constitution § VII — backend is NLU-free |
| Date picker UI | Native `<input type="date">` | No new npm packages; already available in all modern browsers |
| Overdue filter | Server-side WHERE clause | Consistent with backend-authoritative data pattern |

---

## Phases

### Phase 1 — Database Migration

**Goal:** Add `due_date` column to `tasks` table without breaking existing rows.

**Approach:** Execute `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS due_date TIMESTAMP WITH TIME ZONE;` in the FastAPI lifespan startup block (after `create_all`). `IF NOT EXISTS` makes it idempotent on repeated restarts.

**Files to modify:**
- `backend/main.py` — add ALTER TABLE in lifespan
- `backend/models.py` — add `due_date` field to `Task` SQLModel and `TaskCreate`, `TaskUpdate`, `TaskRead`

**Acceptance checks:**
- [ ] Column exists in Neon DB after restart
- [ ] Existing tasks have `due_date = NULL` (no data loss)
- [ ] `TaskRead.due_date` serialises as ISO string or `null`

---

### Phase 2 — Backend: API + Filtering

**Goal:** Extend task CRUD endpoints to accept and return `due_date`; add `?overdue=true` filter.

**Files to modify:**
- `backend/models.py` — `TaskCreate.due_date`, `TaskUpdate.due_date`, `TaskRead.due_date`
- `backend/routes/tasks.py` — `?overdue=true` query param in list endpoint

**Overdue filter logic:**
```python
if overdue:
    statement = statement.where(
        Task.due_date < datetime.now(timezone.utc),
        Task.completed == False,
    )
```

**Acceptance checks:**
- [ ] `POST /api/tasks` with `due_date` stores value correctly
- [ ] `GET /api/tasks?overdue=true` returns only overdue incomplete tasks
- [ ] `PUT /api/tasks/{id}` with `due_date: null` clears the field
- [ ] `TaskRead` response includes `due_date` as ISO string or `null`

---

### Phase 3 — Backend: MCP Tool Extensions

**Goal:** Extend `add_task` and `update_task` in `backend/tools/task_tools.py` to accept and persist `due_date`.

**Files to modify:**
- `backend/tools/task_tools.py` — `add_task(... due_date=None)`, `update_task(... due_date=None)`

**Cohere tool schema update** (in `backend/routes/chat.py` TOOLS list):
```json
{
  "name": "due_date",
  "description": "ISO 8601 UTC datetime for when the task is due, e.g. '2026-02-25T00:00:00Z'. Compute from natural language like 'due tomorrow' or 'due next Monday'. Omit if not mentioned.",
  "type": "str",
  "required": false
}
```

**Acceptance checks:**
- [ ] `add_task(due_date="2026-02-25T00:00:00Z")` persists correctly
- [ ] `update_task(task_id=1, due_date=None)` clears the field
- [ ] Tool result dict includes `"due_date"` key (as string, per `_result_to_document_data` contract)

---

### Phase 4 — Frontend: Types + API Client

**Goal:** Extend TypeScript types and API client to carry `due_date`.

**Files to modify:**
- `frontend/src/types/index.ts` — add `due_date?: string | null` to `Task` interface
- `frontend/src/lib/api.ts` — add `due_date` to `CreateTaskPayload` and `UpdateTaskPayload`

**Acceptance checks:**
- [ ] TypeScript: 0 errors on modified types
- [ ] `createTask({ title: "x", due_date: "2026-02-25T00:00:00Z" })` sends correct body

---

### Phase 5 — Frontend: UI Components

**Goal:** Add due date picker to create/edit forms; add badge to task cards.

**New components:**
- `DueDateBadge` — `frontend/src/components/features/tasks/due-date-badge.tsx`
  - Props: `dueDate: string | null | undefined`
  - Colour logic: red if overdue, amber if due today, green otherwise
  - Display: `Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(dueDate))`

**Modified components:**
- `TaskCreateDialog` — add `<input type="date">` field, map to ISO UTC string on submit
- `TaskEditDialog` — pre-populate date input from `task.due_date`; clear → `null`
- `TaskCard` — render `<DueDateBadge dueDate={task.due_date} />` below title
- `TaskFilters` — add "Overdue" toggle chip that sets `?overdue=true` filter

**Date input → UTC conversion:**
```typescript
// Input gives "2026-02-25"; convert to UTC midnight ISO string
const isoString = value ? new Date(value + "T00:00:00").toISOString() : null;
```

**Acceptance checks:**
- [ ] Creating task with date shows badge on card
- [ ] Overdue badge is red; today badge is amber
- [ ] Clearing date in edit form sends `due_date: null` to API
- [ ] "Overdue" filter chip shows only overdue tasks
- [ ] TypeScript: 0 errors

---

### Phase 6 — Cohere Integration Verification

**Goal:** Confirm NL date → tool call works end-to-end.

**Test prompts (manual curl or browser chat):**
- "add a task due tomorrow: review PRs" → AI calls `add_task(due_date="<tomorrow ISO>")`
- "update task 1 to be due next Monday" → AI calls `update_task(task_id=1, due_date="<next Monday ISO>")`
- "show me my overdue tasks" → AI calls `list_tasks(status=...)`  or uses `list_overdue`

---

### Phase 7 — Testing

| Test | Expected |
|------|----------|
| `POST /api/tasks {"due_date":"2026-02-25T00:00:00Z"}` | 201, `due_date` in response |
| `GET /api/tasks?overdue=true` | Returns only overdue incomplete tasks |
| `PUT /api/tasks/{id} {"due_date":null}` | Clears `due_date` |
| NL: "add task due tomorrow" | Cohere calls `add_task` with correct ISO date |
| Task card with past due date | Red `DueDateBadge` shown |
| TypeScript diagnostics | 0 errors |

---

## Risks & Mitigations

| Risk | Blast radius | Mitigation |
|------|-------------|------------|
| ALTER TABLE fails on cloud DB | Startup crash | Wrap in try/except; log; continue |
| Browser timezone offsets misalign due dates | Confusing badge colour | Use `Intl.DateTimeFormat` for display; store UTC |
| Cohere hallucinates wrong date | Wrong due date set | AI response shows resolved date; user can correct |
