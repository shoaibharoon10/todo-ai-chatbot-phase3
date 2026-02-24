# Tasks 005: Due Dates & Reminders

**Feature:** `005-due-dates-reminders`
**Plan:** `specs/005-due-dates-reminders/plan.md`
**Constitution ref:** v1.2.0 § V (schema), § VII (MCP NL date parsing), § VIII (UTC ISO 8601)
**Date:** 2026-02-23
**Total tasks:** 11

---

## Phase 1 — Database Migration

### T001 — Add `due_date` column to `tasks` table
**File:** `backend/main.py`
**Const. ref:** § V (schema extension additive-only), § VIII (UTC timestamp)

- [x] Add to lifespan startup block (after `SQLModel.metadata.create_all`):
  ```python
  with engine.connect() as conn:
      conn.execute(text("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS due_date TIMESTAMP WITH TIME ZONE"))
      conn.execute(text("CREATE INDEX IF NOT EXISTS ix_tasks_due_date ON tasks (due_date)"))
      conn.commit()
  ```
- [x] Import `text` from `sqlalchemy` if not already present
- [x] Verify: restart backend → column exists in Neon DB → existing rows have `due_date = NULL`

---

## Phase 2 — Backend: Models

### T002 — Extend SQLModel `Task` and Pydantic schemas with `due_date`
**File:** `backend/models.py`
**Const. ref:** § V (TaskRead includes all fields)

- [x] Add to `Task` SQLModel:
  ```python
  from sqlalchemy import DateTime
  due_date: datetime | None = Field(
      sa_column=Column(DateTime(timezone=True), nullable=True, index=True),
      default=None,
  )
  ```
- [x] Add to `TaskCreate`:
  ```python
  due_date: datetime | None = None
  ```
- [x] Add to `TaskUpdate`:
  ```python
  due_date: datetime | None = None
  ```
- [x] Add to `TaskRead`:
  ```python
  due_date: datetime | None = None
  ```
- [x] Verify: `GET /api/tasks` response includes `"due_date": null` per task

---

## Phase 3 — Backend: API Filtering

### T003 — Add `?overdue=true` filter to task list endpoint
**File:** `backend/routes/tasks.py`
**Const. ref:** § V (`GET /api/tasks?overdue=true` contract)

- [x] Add `overdue: bool = False` query parameter to list endpoint
- [x] Apply filter when `overdue=True`:
  ```python
  if overdue:
      statement = statement.where(
          Task.due_date < datetime.now(timezone.utc),
          Task.completed == False,
      )
  ```
- [x] Verify: `GET /api/tasks?overdue=true` returns only incomplete tasks with `due_date < now`
- [x] Verify: tasks without `due_date` are excluded from overdue results

---

## Phase 4 — Backend: MCP Tool Extensions

### T004 — Extend `add_task` and `update_task` tools with `due_date`
**File:** `backend/tools/task_tools.py`
**Const. ref:** § VII (tools are thin DB wrappers; NL parsing is Cohere's responsibility)

- [x] Add `due_date: str | None = None` to `add_task` signature
- [x] Parse ISO string → `datetime` inside tool (use `datetime.fromisoformat`); handle `None`
- [x] Persist `due_date` on `Task` row in `add_task`
- [x] Add `due_date: str | None = None` to `update_task` signature
- [x] Apply `due_date` update only when argument is explicitly provided (not default `None`)
  - Use sentinel: `due_date=UNSET` pattern or check via `**kwargs` approach
  - Simplest: if `due_date is not None`, apply; to clear pass `"null"` as string → set `None`
- [x] Return `"due_date"` as string (or `""`) in result dict (Cohere document format requirement)
- [x] Verify: `add_task(due_date="2026-02-25T00:00:00Z")` stores correct UTC datetime

---

## Phase 5 — Backend: Cohere Tool Schema

### T005 — Update Cohere `add_task` / `update_task` tool definitions
**File:** `backend/routes/chat.py`
**Const. ref:** § VII (Cohere is authoritative NLU layer for date parsing)

- [x] Add `due_date` parameter to `add_task` tool schema:
  ```json
  {
    "name": "due_date",
    "description": "ISO 8601 UTC datetime for when the task is due (e.g. '2026-02-25T00:00:00Z'). Compute from natural language: 'due tomorrow' → next day at midnight UTC, 'due next Monday' → next Monday midnight UTC. Omit if not mentioned.",
    "type": "str",
    "required": false
  }
  ```
- [x] Add same `due_date` parameter to `update_task` tool schema
- [x] Verify: chat message "add a task due tomorrow: buy groceries" → Cohere calls `add_task` with computed ISO date

---

## Phase 6 — Frontend: Types & API Client

### T006 — Extend TypeScript `Task` type and payload types
**File:** `frontend/src/types/index.ts`
**Const. ref:** § IV (centralized API client; TypeScript throughout)

- [x] Add `due_date?: string | null` to `Task` interface
- [x] Add `due_date?: string | null` to `CreateTaskPayload`
- [x] Add `due_date?: string | null` to `UpdateTaskPayload`
- [x] Verify: TypeScript diagnostics — 0 errors

### T007 — Extend `getTasks` API function with overdue filter
**File:** `frontend/src/lib/api.ts`

- [x] Add `overdue?: boolean` to the `filters` argument of `getTasks`
- [x] When `overdue` is `true`, append `?overdue=true` to URL params
- [x] Verify: `getTasks({ overdue: true })` sends correct query param

---

## Phase 7 — Frontend: UI Components

### T008 — Create `DueDateBadge` component
**File:** `frontend/src/components/features/tasks/due-date-badge.tsx`
**Const. ref:** § VIII (display in local timezone via `Intl.DateTimeFormat`)

- [x] Create `"use client"` component accepting `dueDate: string | null | undefined`
- [x] Return `null` when `dueDate` is null/undefined
- [x] Colour logic (using `Date` comparison with `Date.now()`):
  - `dueDate < now` → red (`bg-red-100 text-red-700`)
  - `dueDate` is today → amber (`bg-amber-100 text-amber-700`)
  - `dueDate > today` → green (`bg-green-100 text-green-700`)
- [x] Display using `Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(dueDate))`
- [x] Add `CalendarDays` lucide icon (4×4) inside badge
- [x] Verify: past date shows red; today shows amber; future shows green

### T009 — Add `DueDatePicker` to `TaskCreateDialog` and `TaskEditDialog`
**Files:** `frontend/src/components/features/tasks/task-create-dialog.tsx`, `task-edit-dialog.tsx`

- [x] Add `<input type="date" />` field in both dialogs (optional; labeled "Due Date")
- [x] On submit: convert `"YYYY-MM-DD"` → ISO UTC string:
  ```typescript
  const isoString = value ? new Date(value + "T00:00:00").toISOString() : null;
  ```
- [x] In edit dialog: pre-populate from `task.due_date` using `new Date(task.due_date).toISOString().split("T")[0]`
- [x] Clearing the input sends `due_date: null`
- [x] Verify: create task with date → badge appears on card; edit → date pre-populated; clear → badge gone

### T010 — Add "Overdue" filter chip to `TaskFilters`
**File:** `frontend/src/components/features/tasks/task-filters.tsx`

- [x] Add "Overdue" toggle chip/button alongside existing filters
- [x] When active: call `getTasks({ overdue: true })` (or pass filter state up)
- [x] Style: amber when active to match overdue colour theme
- [x] Verify: clicking "Overdue" shows only overdue tasks; clicking again restores all

### T011 — Add `DueDateBadge` to `TaskCard`
**File:** `frontend/src/components/features/tasks/task-card.tsx`

- [x] Import and render `<DueDateBadge dueDate={task.due_date} />` below task title/description
- [x] Verify: task with due date shows badge; task without does not

---

## Phase 8 — End-to-End Testing

### T012 — Verify due dates end-to-end
**Const. ref:** § VI (all errors handled; list endpoints support filtering)

| Check | Expected |
|-------|----------|
| `POST /api/tasks {"due_date":"2026-02-25T00:00:00Z"}` | 201; `due_date` in response |
| `GET /api/tasks?overdue=true` | Only incomplete tasks with past due_date |
| `PUT /api/tasks/{id} {"due_date":null}` | `due_date: null` in response; badge gone |
| `POST /api/tasks {"due_date":"not-a-date"}` | 422 (Pydantic datetime validation) |
| Chat: "add task due tomorrow: review PR" | Cohere calls `add_task` with ISO date |
| TaskCard with past due_date | Red `DueDateBadge` |
| TypeScript diagnostics | 0 errors |
