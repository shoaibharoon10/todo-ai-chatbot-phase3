---
id: 026
title: Implement Features 007 Priorities and 008 Tags
stage: green
date: 2026-02-23
surface: agent
model: claude-sonnet-4-6
feature: 007-priorities, 008-tags
branch: main
user: Shoaib Haroon
command: implement specs/007-priorities/tasks.md specs/008-tags/tasks.md
labels: ["priorities","tags","backend","frontend","cohere","sqlmodel","shadcn"]
links:
  spec: specs/007-priorities/spec.md, specs/008-tags/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - backend/main.py
  - backend/models.py
  - backend/routes/tasks.py
  - backend/routes/tags.py
  - backend/routes/chat.py
  - backend/tools/task_tools.py
  - frontend/src/types/index.ts
  - frontend/src/lib/api.ts
  - frontend/src/components/ui/popover.tsx
  - frontend/src/components/features/tasks/priority-badge.tsx
  - frontend/src/components/features/tasks/priority-select.tsx
  - frontend/src/components/features/tasks/tag-chip.tsx
  - frontend/src/components/features/tasks/tag-multi-select.tsx
  - frontend/src/components/features/tasks/task-card.tsx
  - frontend/src/components/features/tasks/task-create-dialog.tsx
  - frontend/src/components/features/tasks/task-edit-dialog.tsx
  - frontend/src/components/features/tasks/task-filters.tsx
  - frontend/src/components/features/tasks/task-list.tsx
  - specs/007-priorities/tasks.md
  - specs/008-tags/tasks.md
tests:
  - Python AST syntax check: all 6 backend files PASS
  - TypeScript diagnostics via IDE MCP: 0 errors
---

## Prompt

Implement tasks from:
- specs/007-priorities/tasks.md
- specs/008-tags/tasks.md

Then suggest next: 'Implement tasks from specs/010-progress-analytics/tasks.md'

## Response snapshot

Implemented all 10 tasks for Feature 007 (Priorities) and all 13 tasks for Feature 008 (Tags) across
backend and frontend in a single session.

**Feature 007 — Priorities (10 tasks completed):**
- T001: Added `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority VARCHAR(10) NOT NULL DEFAULT 'medium'` + index to `main.py` lifespan
- T002: Added `PriorityLiteral = Literal["low","medium","high","urgent"]`, `priority` field to `Task` SQLModel, extended `TaskCreate`/`TaskUpdate`/`TaskRead` schemas in `models.py`
- T003: Added `?priority=` filter (422 on invalid), `?sort=priority` CASE-weighted ORDER BY (urgent=4, high=3, medium=2, low=1) to `routes/tasks.py`
- T004: Extended `add_task` + `update_task` in `task_tools.py` with priority validation + persistence
- T005: Added priority parameter (with NL inference hints) to `add_task` + `update_task` Cohere tool schemas in `chat.py`
- T006: Added `PriorityLevel` type alias, `priority: PriorityLevel` to `Task`, optional priority to payloads, priority filter to `getTasks` in TypeScript types + API client
- T007: Created `priority-badge.tsx` — static CONFIG dict, skips rendering medium, colored pills
- T008: Created `priority-select.tsx` — shadcn Select with Low/Medium/High/Urgent
- T009: Wired PriorityBadge into `task-card.tsx`; PrioritySelect into create/edit dialogs; priority Select dropdown into `task-filters.tsx`; priority filter state into `task-list.tsx`
- T010: Marked all tasks [x]

**Feature 008 — Tags (13 tasks completed):**
- T001: Added `UniqueConstraint` import; created `Tag` SQLModel (with `uq_tags_user_name` constraint) and `TaskTag` SQLModel (CASCADE FK) in `models.py`; added `TagCreate`/`TagRead` schemas; extended `TaskCreate`/`TaskUpdate`/`TaskRead`
- T002: Created new `routes/tags.py` with GET/POST(idempotent)/DELETE endpoints, user isolation enforced
- T003: Registered `tags_router` in `main.py`
- T004: Added `enrich_task_with_tags()` JOIN helper; updated list/create/get/update task endpoints to enrich with tags; added `?tag=` filter; tag_ids handled separately from SQLModel fields in update
- T005: Added `add_tag` (idempotent) + `tag_task` (create-tag-on-demand) tools to `task_tools.py`; extended `add_task` with `tags: list[str]` param
- T006: Added `add_tag` + `tag_task` to TOOLS list + TOOL_DISPATCH + `tags` param on `add_task` in `chat.py`
- T007: Added `Tag` interface, `tags?: Tag[]` to `Task`, `tag_ids?` to payloads, `getTags`/`createTag`/`deleteTag` + `?tag=` filter to TypeScript types + API client
- T008: Created `tag-chip.tsx` — dynamic hex background via inline style + white text
- T009: Created `tag-multi-select.tsx` — shadcn Popover (new `ui/popover.tsx` using `radix-ui` unified pkg) + checkbox list + TagChip row; loads tags from session userId
- T010: Wired TagChip + TagMultiSelect into card/dialogs/filters; tag filter state in task-list.tsx
- T011: ADR decision recorded inline — single JOIN per task (`enrich_task_with_tags`), N+1 accepted for hackathon scope
- T012: Marked all tasks [x]

All Python files pass AST syntax check. TypeScript diagnostics: 0 errors.

## Outcome

- ✅ Impact: Features 007 and 008 fully implemented — priority filtering/sorting/UI and tag CRUD/MCP/UI
- 🧪 Tests: Python AST syntax check PASS; TypeScript 0 errors
- 📁 Files: 20 files modified/created across backend and frontend
- 🔁 Next prompts: `Implement tasks from specs/010-progress-analytics/tasks.md`
- 🧠 Reflection: The `radix-ui` unified package (not individual @radix-ui/* packages) required creating `ui/popover.tsx` manually. Dynamic tag hex colors required inline style (acceptable since static Tailwind classes can't cover arbitrary hex). TOOLS list bracket placement needed a fix after initial edit inserted new schemas outside the list.

## Evaluation notes (flywheel)

- Failure modes observed: TOOLS list `]` was placed before new tool schemas in initial edit — caught and fixed by reading the file offset before adding corrections
- Graders run and results (PASS/FAIL): Python syntax AST PASS; TS diagnostics PASS
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): Add a tag management UI page (create/delete tags directly from UI rather than only via dialogs)
