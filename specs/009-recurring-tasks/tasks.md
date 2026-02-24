# Tasks 009: Recurring Tasks

**Feature:** `009-recurring-tasks`
**Plan:** `specs/009-recurring-tasks/plan.md`
**Constitution ref:** v1.2.0 § IV (python-dateutil), § VII (NL recurrence → RRULE via Cohere), § VIII (recurrence contract: complete → create next)
**Depends on:** spec 005 tasks complete (`due_date` column must exist on `tasks`)
**Date:** 2026-02-23
**Total tasks:** 13

---

## Phase 1 — Database Migration

### T001 — Add `recurrence_rule` and `recurrence_parent_id` columns
**File:** `backend/main.py`
**Const. ref:** § V (schema extension additive-only), § VIII (recurrence contract)

- [x] Add to lifespan startup block:
  ```python
  conn.execute(text("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence_rule TEXT"))
  conn.execute(text("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence_parent_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL"))
  ```
- [x] Verify: both columns exist in Neon DB after restart
- [x] Verify: existing tasks have both columns as NULL

---

## Phase 2 — Backend: Models

### T002 — Extend SQLModel `Task` and Pydantic schemas
**File:** `backend/models.py`
**Const. ref:** § V (TaskRead includes all fields)

- [x] Add to `Task` SQLModel:
  ```python
  from sqlalchemy import Integer
  recurrence_rule: str | None = Field(sa_column=Column(Text, nullable=True), default=None)
  recurrence_parent_id: int | None = Field(
      sa_column=Column(Integer, ForeignKey("tasks.id", ondelete="SET NULL"), nullable=True),
      default=None,
  )
  ```
- [x] Add to `TaskCreate`: `recurrence_rule: str | None = None`
- [x] Add to `TaskUpdate`: `recurrence_rule: str | None = None`
- [x] Add to `TaskRead`: `recurrence_rule: str | None = None`, `recurrence_parent_id: int | None = None`
- [x] Add `CompleteTaskResponse(TaskRead)` with `next_occurrence: TaskRead | None = None`
- [x] Verify: TypeScript types generate correctly from models

---

## Phase 3 — Backend: Recurrence Library

### T003 — Add `python-dateutil` to requirements
**File:** `backend/requirements.txt`
**Const. ref:** § IV (python-rrule = python-dateutil, locked dependency)

- [x] Add line: `python-dateutil>=2.8.2`
- [x] Verify: `pip install -r requirements.txt` succeeds without conflicts
- [x] Verify: `from dateutil.rrule import rrulestr` works in Python shell

### T004 — Create `compute_next_occurrence` helper
**File:** `backend/recurrence.py` *(new file)*
**Const. ref:** § VIII (recurrence contract — next occurrence computed server-side)

- [x] Create module with:
  ```python
  from dateutil.rrule import rrulestr
  from datetime import datetime, timedelta

  def compute_next_occurrence(rule_str: str, after: datetime) -> datetime | None:
      """Return the first occurrence strictly after `after`, or None if none within 2 years."""
      try:
          rule = rrulestr(rule_str, dtstart=after)
          nxt = rule.after(after, inc=False)
          horizon = after + timedelta(days=730)
          return nxt if nxt and nxt <= horizon else None
      except Exception:
          return None
  ```
- [x] Unit test (inline or manual):
  - `compute_next_occurrence("FREQ=DAILY", today)` → tomorrow ✓
  - `compute_next_occurrence("FREQ=WEEKLY;BYDAY=MO", thursday)` → next Monday ✓
  - `compute_next_occurrence("INVALID_RRULE", today)` → `None` (no crash) ✓

---

## Phase 4 — Backend: Extended Complete Endpoint

### T005 — Extend PATCH `/tasks/{id}/complete` to create next occurrence
**File:** `backend/routes/tasks.py`
**Const. ref:** § VIII (completion of recurring task → create next; constitution contract)

- [x] Import `CompleteTaskResponse` from `models` and `compute_next_occurrence` from `recurrence`
- [x] After toggling `task.completed = True`:
  - Check `task.recurrence_rule is not None and task.due_date is not None`
  - Call `compute_next_occurrence(task.recurrence_rule, task.due_date)`
  - If next date found: insert new `Task` row copying `title`, `description`, `priority`, `recurrence_rule`, setting `due_date=next_due`, `recurrence_parent_id = task.recurrence_parent_id or task.id`
  - `session.flush()` to get new task's `id` before commit
- [x] Return `CompleteTaskResponse` (extends `TaskRead` with `next_occurrence: TaskRead | None`)
- [x] When toggling task back to incomplete: skip recurrence logic (only trigger on `completed → True` transition)
- [x] Verify: completing non-recurring task → `next_occurrence: null`; behaviour unchanged
- [x] Verify: completing daily task → new task with `due_date = tomorrow`, `recurrence_parent_id` set

---

## Phase 5 — Backend: MCP Tool Extensions

### T006 — Extend `add_task` and `complete_task` tools with recurrence
**File:** `backend/tools/task_tools.py`
**Const. ref:** § VII (MCP tools are thin DB wrappers; RRULE validation server-side)

- [x] Add `recurrence_rule: str | None = None` to `add_task` signature
- [x] In `add_task`: if `recurrence_rule` provided, validate via `rrulestr` parse; return `{"error": "Invalid recurrence rule: ..."}` if invalid
- [x] Persist `recurrence_rule` on new `Task` row
- [x] In `complete_task`: detect `task.recurrence_rule` and call `compute_next_occurrence`; if next found, insert new task row; include `"next_occurrence_due"` in result dict
- [x] Return `"recurrence_rule"` and `"recurrence_parent_id"` as strings in result dicts (Cohere format)
- [x] Verify: `add_task(recurrence_rule="FREQ=DAILY")` stores rule; `add_task(recurrence_rule="BAD")` returns error dict

---

## Phase 6 — Backend: Cohere Tool Schema

### T007 — Update `add_task` Cohere tool definition with `recurrence_rule`
**File:** `backend/routes/chat.py`
**Const. ref:** § VII (Cohere is authoritative NLU; generates RRULE from natural language)

- [x] Add `recurrence_rule` parameter to `add_task` tool schema:
  ```json
  {
    "name": "recurrence_rule",
    "description": "RFC 5545 RRULE string for recurring tasks. Generate from natural language: 'every day' → 'FREQ=DAILY', 'every weekday'/'every weekday morning' → 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR', 'every Monday' → 'FREQ=WEEKLY;BYDAY=MO', 'every month' → 'FREQ=MONTHLY', 'weekly' → 'FREQ=WEEKLY'. Omit for non-recurring tasks.",
    "type": "str",
    "required": false
  }
  ```
- [x] Verify: "add a daily standup task every weekday at 9am" → Cohere calls `add_task(recurrence_rule="FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR")`

---

## Phase 7 — Frontend: Types & API

### T008 — Extend TypeScript `Task` type with recurrence fields
**File:** `frontend/src/types/index.ts`

- [x] Add to `Task` interface:
  ```typescript
  recurrence_rule?: string | null;
  recurrence_parent_id?: number | null;
  next_occurrence?: Task | null;
  ```
- [x] Add to `CreateTaskPayload`: `recurrence_rule?: string | null`
- [x] Add to `UpdateTaskPayload`: `recurrence_rule?: string | null`
- [x] Verify: TypeScript 0 errors

### T009 — Update `toggleTask` return type in API client
**File:** `frontend/src/lib/api.ts`

- [x] Change `toggleTask` return type from `Promise<Task>` to `Promise<Task & { next_occurrence?: Task | null }>`
- [x] Add `recurrence_rule` to `CreateTaskPayload` body in `createTask` (flows through payload automatically)
- [x] Verify: TypeScript 0 errors

---

## Phase 8 — Frontend: UI Components

### T010 — Create `RecurrenceSelect` component
**File:** `frontend/src/components/features/tasks/recurrence-select.tsx` *(new file)*
**Const. ref:** § IV (shadcn/ui components; no new npm packages)

- [x] Create shadcn/ui `Select` with options:
  - "None" → `null`
  - "Daily" → `"FREQ=DAILY"`
  - "Weekdays" → `"FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR"`
  - "Weekly" → `"FREQ=WEEKLY"`
  - "Monthly" → `"FREQ=MONTHLY"`
- [x] Props: `value: string | null; onChange: (v: string | null) => void`
- [x] Verify: TypeScript 0 errors

### T011 — Create `RecurrenceBadge` component
**File:** `frontend/src/components/features/tasks/recurrence-badge.tsx` *(new file)*

- [x] Maps RRULE → human label:
  - `FREQ=DAILY` → "Daily"
  - `FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR` → "Weekdays"
  - `FREQ=WEEKLY` → "Weekly"
  - `FREQ=MONTHLY` → "Monthly"
  - Unknown → "Recurring"
- [x] Render small indigo pill with `Repeat` lucide icon
- [x] Return `null` if no `recurrence_rule`

### T012 — Wire `RecurrenceSelect` + `RecurrenceBadge` into dialogs and card
**Files:** `task-create-dialog.tsx`, `task-edit-dialog.tsx`, `task-card.tsx`

- [x] `TaskCreateDialog`: add `<RecurrenceSelect>` field; include `recurrence_rule` in `createTask` call
- [x] `TaskEditDialog`: add `<RecurrenceSelect>` pre-populated from `task.recurrence_rule`; include in update call
- [x] `TaskCard`: add `<RecurrenceBadge recurrenceRule={task.recurrence_rule} />` beside due date badge
- [x] After `toggleTask` response: if `next_occurrence` present → show toast: "Recurring task done — next due [date]"
- [x] Verify: TypeScript 0 errors; badge shows on recurring cards; toast fires on completion

---

## Phase 9 — End-to-End Testing

### T013 — Verify recurrence end-to-end
**Const. ref:** § VI (all operations complete and correct; chatbot tool results persisted)

| Check | Expected |
|-------|----------|
| `POST /api/tasks {"recurrence_rule":"FREQ=DAILY","due_date":"<today>"}` | Task created with rule |
| `PATCH /api/tasks/{id}/complete` on recurring task | New task created; `next_occurrence` in response |
| `PATCH /complete` on non-recurring task | `next_occurrence: null`; no new row |
| `compute_next_occurrence("INVALID", ...)` | Returns `None`; no 500 error |
| Chat: "add a daily standup every weekday" | `add_task(recurrence_rule="FREQ=WEEKLY;BYDAY=...")` |
| RecurrenceBadge on card | "Weekdays" badge shown |
| Complete toast | "next due [date]" message shown |
| TypeScript diagnostics | 0 errors |
