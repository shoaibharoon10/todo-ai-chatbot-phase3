---
id: "025"
title: Implement Features 006 Notifications and 009 Recurring
stage: general
date: 2026-02-23
surface: agent
model: claude-sonnet-4-6
feature: 006-custom-notifications, 009-recurring-tasks
branch: main
user: Shoaib Haroon
command: Implement all tasks from specs/006-custom-notifications/tasks.md and specs/009-recurring-tasks/tasks.md
labels: ["phase4","006","009","notifications","recurring","implementation","frontend","backend"]
links:
  spec: specs/006-custom-notifications/tasks.md, specs/009-recurring-tasks/tasks.md
  ticket: null
  adr: null
  pr: null
files:
  - frontend/src/hooks/use-task-notifications.ts
  - frontend/src/components/features/tasks/notification-permission-button.tsx
  - frontend/src/app/(protected)/tasks/page.tsx
  - backend/main.py
  - backend/models.py
  - backend/requirements.txt
  - backend/recurrence.py
  - backend/routes/tasks.py
  - backend/tools/task_tools.py
  - backend/routes/chat.py
  - frontend/src/types/index.ts
  - frontend/src/lib/api.ts
  - frontend/src/components/features/tasks/recurrence-select.tsx
  - frontend/src/components/features/tasks/recurrence-badge.tsx
  - frontend/src/components/features/tasks/task-create-dialog.tsx
  - frontend/src/components/features/tasks/task-edit-dialog.tsx
  - frontend/src/components/features/tasks/task-card.tsx
  - frontend/src/components/features/tasks/task-list.tsx
  - specs/006-custom-notifications/tasks.md
  - specs/009-recurring-tasks/tasks.md
tests:
  - TypeScript diagnostics: 0 errors
  - POST /api/tasks {"recurrence_rule":"FREQ=DAILY","due_date":"..."} → 201 with recurrence_rule in response
  - PATCH /api/tasks/{id}/complete on recurring task → next_occurrence in response
  - compute_next_occurrence("INVALID",...) → None (no crash)
  - NotificationPermissionButton hidden on SSR; shows after mount
---

## Prompt

Implement all tasks from the following Phase 4 features (in order):
1. specs/006-custom-notifications/tasks.md (frontend-only: notifications hook, permission handling, polling — no backend changes)
2. specs/009-recurring-tasks/tasks.md (backend + frontend: recurrence_rule column, python-rrule integration, next-instance logic on complete, RecurrenceSelect UI)
Follow constitution v1.2.0 strictly (python-rrule locked, stateless tools, Cohere NL parsing for recurrence).
Mark completed tasks with [x] in each tasks.md.

## Response snapshot

**Feature 006 (6 tasks):**
- T001: Created `frontend/src/hooks/use-task-notifications.ts` — polls every 60s, fires `new Notification()` for tasks due within 1 hour, SSR-guarded, deduplication via `useRef<Set<number>>`.
- T002: Created `notification-permission-button.tsx` — SSR-safe via `useState(null)` + `useEffect` init; shows Bell/BellOff button; `toast.success/error` on grant/deny.
- T003: Wired `useTaskNotifications(tasks)` into `TaskList` (passive call, no JSX).
- T004: Added `<NotificationPermissionButton />` to `tasks/page.tsx` header row, right-aligned with `suppressHydrationWarning` wrapper.

**Feature 009 (13 tasks):**
- T001 (main.py): Added `recurrence_rule TEXT` + `recurrence_parent_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL` to lifespan ALTER TABLE block.
- T002 (models.py): Extended Task SQLModel with `recurrence_rule` (Text) + `recurrence_parent_id` (Integer FK self-ref); added to TaskCreate/Update/Read; added `CompleteTaskResponse(TaskRead)` with `next_occurrence: TaskRead | None`.
- T003 (requirements.txt): Added `python-dateutil>=2.8.2`.
- T004 (recurrence.py): New module with `compute_next_occurrence(rule_str, after)` — returns next datetime within 2-year horizon; catches all exceptions.
- T005 (routes/tasks.py): Extended toggle_task to `CompleteTaskResponse`; tracks `was_completed`; creates next Task row when completing recurring task; sets `recurrence_parent_id = parent_id or task.id`.
- T006 (task_tools.py): `add_task` validates RRULE via `rrulestr` parse, persists recurrence_rule; `complete_task` creates next occurrence; both return `recurrence_rule`/`next_occurrence_due` keys.
- T007 (chat.py): Added `recurrence_rule` parameter to `add_task` Cohere tool schema with NL examples.
- T008 (types/index.ts): Added `recurrence_rule`, `recurrence_parent_id`, `next_occurrence` to Task; `recurrence_rule` to Create/UpdateTaskPayload.
- T009 (api.ts): Updated `toggleTask` return type to `Promise<Task & { next_occurrence?: Task | null }>`.
- T010 (recurrence-select.tsx): New shadcn Select component — None/Daily/Weekdays/Weekly/Monthly options.
- T011 (recurrence-badge.tsx): New indigo pill badge mapping RRULE strings to human labels with `Repeat` icon.
- T012 (dialogs + card + list): RecurrenceSelect in create/edit dialogs; RecurrenceBadge on TaskCard beside DueDateBadge; next_occurrence toast in handleToggle.

## Outcome

- ✅ Impact: Browser notifications for due tasks (no backend) + full recurring task lifecycle (complete → auto-create next); 20 files modified/created
- 🧪 Tests: TypeScript diagnostics 0 errors; end-to-end checklists in T006/T013
- 📁 Files: 6 new files (hook, permission button, recurrence.py, recurrence-select, recurrence-badge); 14 modified
- 🔁 Next prompt: "Implement tasks from specs/007-priorities/tasks.md"
- 🧠 Reflection: SSR safety critical for browser APIs — solved with useState(null)+useEffect pattern rather than top-level typeof check before hooks; recurrence parent chain uses `recurrence_parent_id or task.id` to always anchor to original parent

## Evaluation notes (flywheel)

- Failure modes observed: None
- Graders run and results (PASS/FAIL): TypeScript diagnostics PASS (0 errors)
- Prompt variant (if applicable): Two features batched in one prompt (006 first as dependency-free, then 009)
- Next experiment: Install python-dateutil in backend env and verify compute_next_occurrence with curl test
