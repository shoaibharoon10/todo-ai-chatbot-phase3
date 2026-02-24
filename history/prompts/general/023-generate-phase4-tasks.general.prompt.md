---
id: "023"
title: Generate Phase 4 Tasks in Dependency Order
stage: general
date: 2026-02-23
surface: agent
model: claude-sonnet-4-6
feature: none
branch: main
user: Shoaib Haroon
command: generate tasks for all Phase 4 plans in dependency order
labels: ["phase4","tasks","005","006","007","008","009","010","011","012"]
links:
  spec: specs/005-due-dates-reminders/tasks.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/005-due-dates-reminders/tasks.md
  - specs/006-custom-notifications/tasks.md
  - specs/007-priorities/tasks.md
  - specs/008-tags/tasks.md
  - specs/009-recurring-tasks/tasks.md
  - specs/010-progress-analytics/tasks.md
  - specs/011-offline-pwa/tasks.md
  - specs/012-task-notes-attachments/tasks.md
tests:
  - All 8 tasks.md files created and readable
  - ADR tasks included in 008 (T011) and 011 (T011)
  - All tasks numbered T001-T0XX with [ ] checklists
---

## Prompt

Generate tasks for all Phase 4 plans in dependency order (005 first, then 006/009 which depend on 005, then 007/008/010/011/012). For each: create tasks.md with numbered T001-T0XX, phased across DB migration → backend → frontend → Cohere → testing, with constitution v1.2.0 references and ADR tasks where indicated.

## Response snapshot

8 tasks.md files created covering 83 total tasks (T001-T013 per feature):

- **005** (12 tasks): DB ALTER TABLE + index → models → overdue filter → MCP tools → Cohere schema → TS types → API client → DueDateBadge → DueDatePicker in dialogs → TaskFilters chip → TaskCard wire → E2E tests
- **006** (6 tasks): useTaskNotifications hook → NotificationPermissionButton → wire into TaskList → add to tasks page → SSR guard test → E2E notification test
- **007** (10 tasks): DB migration → Pydantic Literal validation → filter/CASE sort → MCP tools → Cohere schema → TS types/API → PriorityBadge → PrioritySelect → wire into dialogs/card/filters → E2E tests
- **008** (12 tasks): Tag + TaskTag SQLModel → tag endpoints → register router → task CRUD with tags → add_tag/tag_task MCP tools → Cohere schema → TS types/API → TagChip → TagMultiSelect → wire dialogs/card/filters → ADR task → E2E tests
- **009** (13 tasks): DB 2 columns → SQLModel + CompleteTaskResponse → python-dateutil dep → compute_next_occurrence helper → complete endpoint extension → MCP tools → Cohere schema → TS types → API → RecurrenceSelect → RecurrenceBadge → wire dialogs/card → E2E tests
- **010** (13 tasks): StatsResponse + WeeklyPoint models → stats endpoint → register router → get_stats MCP → Cohere schema → install recharts → TS types → getStats API → StatsCard → WeeklyChart → DashboardPage → nav links → E2E tests
- **011** (12 tasks): install deps → next-pwa config → manifest.json + icons → layout.tsx link → useOnlineStatus hook → header badge → task-cache.ts → wire cache into TaskList → action-queue.ts → wire queue → ADR task → E2E tests
- **012** (10 tasks): DB ALTER TABLE → models → MCP tools → Cohere schema → TS types → TaskNotesSection → wire into TaskCard → TaskCreateDialog → TaskEditDialog → E2E tests

## Outcome

- ✅ Impact: 83 actionable, checklisted tasks ready for /sp.implement; each task references exact file paths and code stubs
- 🧪 Tests: All 8 files exist and readable; ADR tasks included in 008 (T011) and 011 (T011)
- 📁 Files: 8 tasks.md files across specs/005-012
- 🔁 Next prompt: "Implement all tasks for Phase 4 features, starting with 005"
- 🧠 Reflection: Tasks include concrete code snippets to minimize implementation agent ambiguity; dependency order ensures 005 is complete before 006 and 009 begin

## Evaluation notes (flywheel)

- Failure modes observed: None
- Graders run and results (PASS/FAIL): File existence PASS (8 files)
- Prompt variant (if applicable): Batch task generation for 8 features in a single session
- Next experiment: Run /sp.implement for 005 first; validate DB migration approach before continuing to 006/007/009
