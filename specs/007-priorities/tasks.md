# Tasks 007: Task Priorities

**Feature:** `007-priorities`
**Plan:** `specs/007-priorities/plan.md`
**Constitution ref:** v1.2.0 § V (priority enum, 422 on invalid), § VII (NL priority inference via Cohere), § VIII (enum: low/medium/high/urgent; default medium)
**Date:** 2026-02-23
**Total tasks:** 10

---

## Phase 1 — Database Migration

### T001 — Add `priority` column with server default `'medium'`
**File:** `backend/main.py`
**Const. ref:** § V (schema extension additive-only), § VIII (priority enum values)

- [x] Add to lifespan startup block:
  ```python
  conn.execute(text("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority VARCHAR(10) NOT NULL DEFAULT 'medium'"))
  conn.execute(text("CREATE INDEX IF NOT EXISTS ix_tasks_priority ON tasks (priority)"))
  ```
- [x] Verify: column exists in Neon DB after restart
- [x] Verify: existing tasks have `priority = 'medium'` (server_default applied)

---

## Phase 2 — Backend: Models

### T002 — Extend SQLModel `Task` and Pydantic schemas with `priority`
**File:** `backend/models.py`
**Const. ref:** § VIII (valid values: low/medium/high/urgent; 422 on invalid)

- [x] Add to `Task` SQLModel:
  ```python
  priority: str = Field(
      sa_column=Column(String(10), nullable=False, server_default="medium", index=True),
      default="medium",
  )
  ```
- [x] Add `PriorityLiteral = Literal["low", "medium", "high", "urgent"]` type alias
- [x] Add `priority: PriorityLiteral = "medium"` to `TaskCreate`
- [x] Add `priority: PriorityLiteral | None = None` to `TaskUpdate`
- [x] Add `priority: str = "medium"` to `TaskRead`
- [x] Verify: `POST /api/tasks {"priority":"invalid"}` → 422

---

## Phase 3 — Backend: Filtering & Sorting

### T003 — Add `?priority=` filter and `?sort=priority` to task list endpoint
**File:** `backend/routes/tasks.py`
**Const. ref:** § V (`GET /api/tasks?priority=high`, `?sort=priority`)

- [x] Add `priority: str | None = None` query parameter
- [x] When `priority` provided: validate it is in `{"low","medium","high","urgent"}` (raise 422 otherwise); apply `.where(Task.priority == priority)`
- [x] When `sort == "priority"`: apply ORDER BY using SQLAlchemy CASE
- [x] Verify: `GET /api/tasks?priority=high` → only high tasks
- [x] Verify: `GET /api/tasks?sort=priority` → urgent first, low last

---

## Phase 4 — Backend: MCP Tool Extensions

### T004 — Extend `add_task` and `update_task` with `priority`
**File:** `backend/tools/task_tools.py`
**Const. ref:** § VII (tools validate priority; NL mapping is Cohere's job)

- [x] Add `priority: str = "medium"` to `add_task` signature
- [x] In `add_task`: validate `priority in {"low","medium","high","urgent"}`; return error dict if invalid
- [x] Persist `priority` on `Task` row
- [x] Add `priority: str | None = None` to `update_task` signature
- [x] In `update_task`: if `priority` provided, validate then apply to task
- [x] Include `"priority"` key in all result dicts
- [x] Verify: `add_task(priority="urgent")` stores `urgent`; `add_task(priority="bad")` returns error dict

---

## Phase 5 — Backend: Cohere Tool Schema

### T005 — Add `priority` parameter to `add_task` and `update_task` tool definitions
**File:** `backend/routes/chat.py`
**Const. ref:** § VII (Cohere infers priority from NL; backend validates)

- [x] Add `priority` parameter to `add_task` tool schema with NL inference guidance
- [x] Add same `priority` parameter to `update_task` tool schema
- [x] Verify: "urgent: fix the login bug" → Cohere calls `add_task(priority="urgent")`

---

## Phase 6 — Frontend: Types & API

### T006 — Extend TypeScript types and API client
**Files:** `frontend/src/types/index.ts`, `frontend/src/lib/api.ts`

- [x] Add `priority: "low" | "medium" | "high" | "urgent"` to `Task` interface (required, default assumed "medium")
- [x] Add `priority?: "low" | "medium" | "high" | "urgent"` to `CreateTaskPayload`
- [x] Add `priority?: "low" | "medium" | "high" | "urgent"` to `UpdateTaskPayload`
- [x] Add `priority?: string` to the `filters` argument of `getTasks`; append `?priority=` to URL when provided
- [x] Verify: TypeScript 0 errors

---

## Phase 7 — Frontend: UI Components

### T007 — Create `PriorityBadge` component
**File:** `frontend/src/components/features/tasks/priority-badge.tsx` *(new file)*
**Const. ref:** § IV (Tailwind CSS only; no inline styles)

- [x] Create component with static colour map (no dynamic class generation)
- [x] Render small pill with priority label; fall back to "Medium" config for unknown values
- [x] Skip rendering `medium` priority (reduces visual noise)
- [x] Verify: 4 colour variants render correctly

### T008 — Create `PrioritySelect` component
**File:** `frontend/src/components/features/tasks/priority-select.tsx` *(new file)*

- [x] shadcn/ui `Select` with 4 options: Low, Medium (default), High, Urgent
- [x] Props: `value: string; onChange: (v: string) => void`
- [x] Verify: TypeScript 0 errors

### T009 — Wire `PriorityBadge` + `PrioritySelect` into card, dialogs, and filters
**Files:** `task-card.tsx`, `task-create-dialog.tsx`, `task-edit-dialog.tsx`, `task-filters.tsx`

- [x] `TaskCard`: add `<PriorityBadge priority={task.priority} />` beside due date badge
- [x] `TaskCreateDialog`: add `<PrioritySelect>` defaulting to "medium"; pass `priority` to `createTask`
- [x] `TaskEditDialog`: add `<PrioritySelect>` pre-populated from `task.priority`; include in update call
- [x] `TaskFilters`: add priority `Select` dropdown (All / Low / Medium / High / Urgent); drives `?priority=` filter
- [x] Verify: selecting priority in filters shows only matching tasks

---

## Phase 8 — End-to-End Testing

### T010 — Verify priorities end-to-end
**Const. ref:** § VI (all CRUD operations complete; chatbot tool results persisted)

| Check | Expected |
|-------|----------|
| `POST /api/tasks {"priority":"urgent"}` | 201, `priority: "urgent"` in response |
| `POST /api/tasks {"priority":"critical"}` | 422 |
| `GET /api/tasks?priority=high` | Only high-priority tasks |
| `GET /api/tasks?sort=priority` | urgent → high → medium → low order |
| Chat: "urgent: review the security report" | `add_task(priority="urgent")` called |
| Chat: "make task 5 high priority" | `update_task(task_id=5, priority="high")` |
| PriorityBadge on urgent task | Red styling |
| Existing tasks after migration | All have `priority: "medium"` |
| TypeScript diagnostics | 0 errors |
