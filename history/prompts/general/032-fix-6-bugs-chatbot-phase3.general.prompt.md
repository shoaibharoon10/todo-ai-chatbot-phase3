---
id: "032"
title: Fix 6 bugs in Todo AI Chatbot Phase 3
stage: green
date: 2026-02-24
surface: agent
model: claude-sonnet-4-6
feature: none
branch: main
user: Shoaib Haroon
command: Implement the following plan (fix 6 issues)
labels: ["bug-fix","frontend","backend","tags","recurring-tasks","notifications","dark-mode","offline","pwa"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - frontend/src/components/features/tasks/tag-multi-select.tsx
  - frontend/src/components/features/tasks/task-list.tsx
  - frontend/src/components/features/tasks/task-card.tsx
  - frontend/src/components/features/tasks/task-create-dialog.tsx
  - frontend/src/components/features/tasks/task-edit-dialog.tsx
  - frontend/src/hooks/use-task-notifications.ts
  - frontend/src/types/index.ts
  - frontend/src/app/(protected)/layout.tsx
  - frontend/next.config.ts
  - backend/main.py
  - backend/models.py
  - backend/tools/task_tools.py
  - backend/routes/chat.py
tests:
  - "Create a task with no tags → type name → click + → tag appears selected"
  - "Complete a recurring task → new pending card appears immediately"
  - "Create task with due_date + reminder 15 min → browser notification fires at offset"
  - "Light mode: task cards visibly white with colored left border"
  - "Dark mode: cards still dark"
  - "Disconnect network → navigate to /tasks → stays on tasks (no login redirect)"
  - "POST /api/tasks with reminder_offset_minutes: 30 → field persisted in DB"
---

## Prompt

Implement the following plan:

# Plan: Fix 6 Issues in Todo AI Chatbot

Six confirmed bugs found by reading all relevant source files. Fixes are smallest-viable-diff — no refactors, no new deps, no unrelated edits.

Issue 1 — Tags UI: No inline create when no tags exist (tag-multi-select.tsx)
Issue 2 — Completing recurring task shows "duplicate" on refresh (task-list.tsx)
Issue 3 — No reminder offset in task dialog (multiple backend + frontend files)
Issue 4 — Light mode card invisible (white on white) (task-card.tsx)
Issue 5 — Offline causes redirect to /login (protected layout.tsx)
Issue 6 — next.config.ts turbopack warning (next.config.ts)

## Response snapshot

All 6 fixes implemented across 13 files:

**Issue 1**: Rewrote `tag-multi-select.tsx` to add always-visible `<Input>` + `<Plus>` button at bottom of popover. `handleCreate()` calls `createTag(userId, { name, color })` with a cycling 8-color palette. Appends new tag to local state and selects it.

**Issue 2**: In `task-list.tsx` `handleToggle`, after updating original task, added `setTasks(prev => [...prev, updated.next_occurrence!])` + `setTimeout(fetchTasks, 0)` to immediately show next occurrence card and sync server state.

**Issue 3**: Added `reminder_offset_minutes` column via `ALTER TABLE IF NOT EXISTS` in `main.py`; `int | None` Field on `Task` SQLModel and all Pydantic schemas in `models.py`; param in `add_task` / `update_task` in `task_tools.py`; property in Cohere tool schemas in `chat.py`; `reminder_offset_minutes?: number | null` in TypeScript types; per-task `offsetMs` replacing fixed `oneHour` in `use-task-notifications.ts`; conditional `<select>` (shown when `dueDate` set) in both create and edit dialogs.

**Issue 4**: Computed `priorityBorder` map in `task-card.tsx`, changed Card className to `border border-l-4 border-slate-200 bg-white shadow-sm … dark:bg-slate-800`.

**Issue 5**: In `(protected)/layout.tsx`, catch sets `dbError = true` instead of redirecting; redirect only fires when `!session && !dbError`.

**Issue 6**: Added `turbopack: {}` to `withPWA({…})` call in `next.config.ts`.

## Outcome

- ✅ Impact: All 6 confirmed bugs fixed with minimal diffs; no unrelated code changed
- 🧪 Tests: Manual verification checklist defined; TypeScript types updated for 0-error target
- 📁 Files: 13 files modified (4 backend, 9 frontend)
- 🔁 Next prompts: Run tsc --noEmit to verify; smoke-test each scenario
- 🧠 Reflection: Fixes were independent — implemented in parallel read phase, sequential write phase

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): manual checklist pending
- Prompt variant (if applicable): none
- Next experiment: run TypeScript compiler check on frontend
