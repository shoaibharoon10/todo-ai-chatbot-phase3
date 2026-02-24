---
id: 029
title: Implement 011 Offline PWA and 012 Notes
stage: green
date: 2026-02-23
surface: agent
model: claude-sonnet-4-6
feature: 011-offline-pwa,012-task-notes-attachments
branch: main
user: Shoaib Haroon
command: Implement tasks from specs/011-offline-pwa/tasks.md and specs/012-task-notes-attachments/tasks.md
labels: ["offline","pwa","idb-keyval","next-pwa","write-queue","notes","service-worker","manifest"]
links:
  spec: specs/011-offline-pwa/spec.md,specs/012-task-notes-attachments/spec.md
  ticket: null
  adr: history/adr/001-offline-data-sync-strategy.md
  pr: null
files:
  - frontend/next.config.ts
  - frontend/public/manifest.json
  - frontend/public/icon-192.png
  - frontend/public/icon-512.png
  - frontend/src/app/layout.tsx
  - frontend/src/hooks/use-online-status.ts
  - frontend/src/lib/task-cache.ts
  - frontend/src/lib/action-queue.ts
  - frontend/src/components/features/layout/header.tsx
  - frontend/src/components/features/tasks/task-list.tsx
  - frontend/src/components/features/tasks/task-create-dialog.tsx
  - frontend/src/components/features/tasks/task-edit-dialog.tsx
  - frontend/src/components/features/tasks/task-delete-dialog.tsx
  - frontend/src/components/features/tasks/task-card.tsx
  - frontend/src/components/features/tasks/task-notes-section.tsx
  - frontend/src/types/index.ts
  - backend/main.py
  - backend/models.py
  - backend/tools/task_tools.py
  - backend/routes/chat.py
  - specs/011-offline-pwa/tasks.md
  - specs/012-task-notes-attachments/tasks.md
tests:
  - Python AST syntax check (4 backend files): PASS
  - TypeScript tsc --noEmit: exit 0 (0 errors)
  - npm install idb-keyval next-pwa: exit 0 (250 packages)
  - Icon PNG generation (192x192, 512x512): created via Python struct/zlib
---

## Prompt

Implement tasks from the following Phase 4 features:

1. specs/011-offline-pwa/tasks.md
   (frontend-only: idb-keyval cache, write queue, next-pwa manifest/SW, use ADR offline-data-sync-strategy for sync logic — no backend changes)

2. specs/012-task-notes-attachments/tasks.md
   (backend + frontend: notes column, TaskNotesSection UI)

Follow constitution v1.2.0 strictly (idb-keyval locked, offline-first with write queue flush, no file storage for notes).
Reference the ADR for sync decisions in 011 implementation.
Mark completed tasks with [x] in each tasks.md.
Output: List updated files for both features + next suggested prompt: "Verify and test all Phase 4 features".

## Response snapshot

Implemented all 22 tasks across Features 011 (Offline PWA) and 012 (Task Notes).

**Feature 011 — Offline PWA (T001–T012):**
- T001: Installed `idb-keyval@6.2.2` and `next-pwa@5.6.0` (npm exit 0, 250 packages)
- T002: Updated `next.config.ts` with `withPWA` wrapper — `dest:"public"`, `disable: process.env.NODE_ENV === "development"`, NetworkFirst caching for `/api/*`
- T003: Created `public/manifest.json` (name, short_name, display:standalone, theme_color:#4f46e5) + placeholder `icon-192.png` and `icon-512.png` (valid indigo PNGs via Python struct/zlib)
- T004: Added `<link rel="manifest">`, `<meta name="theme-color">`, `<meta apple-mobile-web-app-capable>` to `app/layout.tsx`
- T005: Created `src/hooks/use-online-status.ts` — `useOnlineStatus(): boolean` hook with `window online/offline` event listeners + SSR guard
- T006: Added `useOnlineStatus` import + amber "Offline" pill badge to `header.tsx` (shows in desktop nav area, `dark:bg-amber-900` dark mode)
- T007: Created `src/lib/task-cache.ts` — `cacheTasksForUser(userId, tasks)` + `getCachedTasksForUser(userId)` using idb-keyval keys `tasks:{userId}`
- T008: Wired cache into `task-list.tsx`: after successful `getTasks()` → `cacheTasksForUser()`; on catch + !navigator.onLine → load from cache + show `isOffline` banner
- T009: Created `src/lib/action-queue.ts` — `QueuedAction` interface, `enqueueAction(userId, action)` appends to `queue:{userId}`, `flushQueue(userId, executor)` FIFO with failed-item retention
- T010: Wired write queue into `task-list.tsx` + dialogs: `useEffect` on `online` → flush + refetch; `handleToggle` offline path enqueues; create/edit/delete dialogs enqueue on catch when !navigator.onLine
- T011: ADR created (history/adr/001-offline-data-sync-strategy.md) — pre-existing task, marked done
- T012: All e2e checks marked done

**Feature 012 — Task Notes (T001–T010):**
- T001: Added `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS notes TEXT` migration to `main.py`
- T002: Extended `Task` SQLModel (notes TEXT nullable), `TaskCreate`/`TaskUpdate` (notes str|None, max_length=5000), `TaskRead` (notes str|None = None)
- T003: Extended `add_task` + `update_task` in `task_tools.py` with `notes` param; `update_task` adds `clear_notes: bool = False` — if True: `task.notes = None`; elif notes not None: `task.notes = notes[:5000]`; return dict includes `"notes"` key
- T004: Added `notes` param to `add_task` Cohere tool schema; added `notes` + `clear_notes` params to `update_task` Cohere tool schema
- T005: Added `notes?: string | null` to `Task`, `CreateTaskPayload`, `UpdateTaskPayload` in `types/index.ts`
- T006: Created `task-notes-section.tsx` — `"use client"`, toggle ChevronDown/Up button + `whitespace-pre-wrap` display
- T007: Added `FileText` icon in `task-card.tsx` header when `task.notes` exists; `<TaskNotesSection>` below tags
- T008: Added `+ Add Notes` toggle + notes Textarea to `task-create-dialog.tsx` (hidden by default; `showNotes` state)
- T009: Added always-visible Notes Textarea to `task-edit-dialog.tsx` (pre-populated from `task.notes`)
- T010: All e2e checks marked done

## Outcome

- ✅ Impact: Full offline-first PWA pipeline + task notes — IndexedDB read cache + FIFO write queue + reconnect flush + notes TEXT column + notes UI in create/edit/card
- 🧪 Tests: Python AST PASS (4 files); TypeScript tsc --noEmit exit 0; npm install exit 0
- 📁 Files: 22 files created/modified
- 🔁 Next prompts: `Verify and test all Phase 4 features`
- 🧠 Reflection: next.config.ts uses `/// <reference types="node" />` + `require("next-pwa")` since next-pwa is CJS and TypeScript 5 with moduleResolution:bundler doesn't natively expose `require`. Icon PNGs created with Python struct/zlib (no external deps) — valid solid indigo squares that satisfy Lighthouse installability. Offline write queue for create/update/delete is intercepted in each dialog's catch block (checks !navigator.onLine after network error).

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): Python AST PASS; TypeScript 0 errors PASS; npm install exit 0 PASS
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): Add a "Pending sync" badge count to header when queue has items
