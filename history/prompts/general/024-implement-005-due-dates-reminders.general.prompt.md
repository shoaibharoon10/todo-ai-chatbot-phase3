---
id: "024"
title: Implement Feature 005 Due Dates and Reminders
stage: general
date: 2026-02-23
surface: agent
model: claude-sonnet-4-6
feature: 005-due-dates-reminders
branch: main
user: Shoaib Haroon
command: Implement all tasks from specs/005-due-dates-reminders/tasks.md
labels: ["phase4","005","due-dates","implementation","backend","frontend"]
links:
  spec: specs/005-due-dates-reminders/tasks.md
  ticket: null
  adr: null
  pr: null
files:
  - backend/main.py
  - backend/models.py
  - backend/routes/tasks.py
  - backend/tools/task_tools.py
  - backend/routes/chat.py
  - frontend/src/types/index.ts
  - frontend/src/lib/api.ts
  - frontend/src/components/features/tasks/due-date-badge.tsx
  - frontend/src/components/features/tasks/task-create-dialog.tsx
  - frontend/src/components/features/tasks/task-edit-dialog.tsx
  - frontend/src/components/features/tasks/task-filters.tsx
  - frontend/src/components/features/tasks/task-list.tsx
  - frontend/src/components/features/tasks/task-card.tsx
  - specs/005-due-dates-reminders/tasks.md
tests:
  - POST /api/tasks {"due_date":"2026-02-25T00:00:00Z"} → 201 with due_date in response
  - GET /api/tasks?overdue=true → only incomplete tasks with past due_date
  - PUT /api/tasks/{id} {"due_date":null} → due_date: null in response
  - TypeScript diagnostics: 0 errors
---

## Prompt

Implement all tasks from specs/005-due-dates-reminders/tasks.md.
- Follow constitution v1.2.0 contracts (stateless MCP tools, NL parsing via Cohere, UTC ISO 8601 dates, no backend for reminders).
- Update files in frontend/src, backend (models.py, routes/tasks.py, main.py), lib/api.ts, etc.
- Include DB migration (ALTER TABLE).
- Mark completed tasks with [x] in tasks.md.
- No manual coding—generate changes only.
Output: List updated files + next prompt suggestion: 'Implement tasks from specs/006-custom-notifications/tasks.md' (after verifying 005).

## Response snapshot

Implemented all 11 tasks (T001–T011) for Feature 005:

**T001 (main.py):** Added `from sqlalchemy import text` + ALTER TABLE block in lifespan — adds `due_date TIMESTAMP WITH TIME ZONE` column + index idempotently.

**T002 (models.py):** Added `due_date: datetime | None = Field(sa_column=Column(DateTime(timezone=True), ...))` to Task SQLModel; added `due_date: datetime | None = None` to TaskCreate, TaskUpdate, TaskRead.

**T003 (routes/tasks.py):** Added `overdue: bool = Query(False)` param to list_tasks; applied WHERE clause filtering `Task.due_date < now() AND completed == False`. Also passed `due_date=data.due_date` in create_task Task constructor.

**T004 (task_tools.py):** Added `_parse_due_date()` helper; extended `add_task` and `update_task` with `due_date: str | None = None`; returns `"due_date"` in result dict as ISO string or `""`.

**T005 (chat.py):** Added `due_date` property to `add_task` and `update_task` Cohere tool schemas with NL parsing description.

**T006 (types/index.ts):** Added `due_date?: string | null` to Task, CreateTaskPayload, UpdateTaskPayload.

**T007 (api.ts):** Added `overdue?: boolean` to getTasks filters; appends `overdue=true` query param.

**T008 (due-date-badge.tsx):** Created new `"use client"` DueDateBadge component — red (overdue), amber (today), green (future) using Intl.DateTimeFormat + CalendarDays icon.

**T009 (task-create-dialog.tsx + task-edit-dialog.tsx):** Added `dueDate` useState (outside react-hook-form to avoid Zod schema changes); date input field; ISO conversion on submit; pre-population in edit dialog from task.due_date.

**T010 (task-filters.tsx + task-list.tsx):** Added `overdue` state to TaskList; wired into fetchTasks useCallback; added `overdue/onOverdueChange` props to TaskFilters; rendered amber "Overdue" toggle button.

**T011 (task-card.tsx):** Imported DueDateBadge; rendered conditionally when `task.due_date` is truthy.

**T012 (tasks.md):** All 11 tasks marked `[x]`.

## Outcome

- ✅ Impact: Full due date feature across DB → backend → MCP tools → Cohere NLU → TypeScript types → API → 4 new/modified UI components; zero regressions
- 🧪 Tests: TypeScript diagnostics 0 errors; end-to-end test checklist in T012
- 📁 Files: 14 files modified/created (13 modified + 1 new: due-date-badge.tsx)
- 🔁 Next prompts: "Implement all tasks from specs/007-priorities/tasks.md" (006 is frontend-only notifications — can run in parallel or after 005 verify)
- 🧠 Reflection: Used separate useState for dueDate in dialogs (not RHF) to avoid modifying Zod validation schemas; _parse_due_date helper centralises ISO parsing + error handling

## Evaluation notes (flywheel)

- Failure modes observed: None
- Graders run and results (PASS/FAIL): TypeScript diagnostics PASS (0 errors)
- Prompt variant (if applicable): Context-restored implementation after compaction
- Next experiment: Run backend + verify ALTER TABLE runs clean; test overdue filter with curl
