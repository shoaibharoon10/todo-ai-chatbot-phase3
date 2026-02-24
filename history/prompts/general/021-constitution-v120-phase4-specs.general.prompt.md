---
id: "021"
title: Constitution v1.2.0 and Phase 4 Specs
stage: general
date: 2026-02-23
surface: agent
model: claude-sonnet-4-6
feature: none
branch: main
user: Shoaib Haroon
command: ratify constitution v1.2.0 and create 8 phase 4 specs
labels: ["constitution","phase4","specs","due-dates","notifications","priorities","tags","recurring","analytics","pwa","notes"]
links:
  spec: .specify/memory/constitution.md
  ticket: null
  adr: null
  pr: null
files:
  - .specify/memory/constitution.md
  - specs/005-due-dates-reminders/spec.md
  - specs/006-custom-notifications/spec.md
  - specs/007-priorities/spec.md
  - specs/008-tags/spec.md
  - specs/009-recurring-tasks/spec.md
  - specs/010-progress-analytics/spec.md
  - specs/011-offline-pwa/spec.md
  - specs/012-task-notes-attachments/spec.md
tests:
  - All 9 files verified to exist and be readable
  - No unresolved placeholders in constitution or specs
---

## Prompt

Ratify constitution update v1.2.0 and implement 8 new features following Spec-Kit Plus workflow.

1. Update Constitution (v1.2.0): Add phase4-advanced-features [due-dates-reminders, custom-notifications, priorities, tags, recurring-tasks, progress-analytics, offline-pwa, task-notes-attachments]. Tech Stack: Add python-rrule, recharts, idb-keyval, next-pwa. Principles: Extend MCP tools; browser-local for notifications/offline; Cohere NL parsing. Ratify 2026-02-23.

2. Create New Specs: numbered dirs 005–012 with spec.md for each feature: DB extensions, MCP tool updates/new (extend add_task for due_date/priority/notes/recurrence; new tools: get_stats, add_tag, tag_task), frontend components, API contracts.

## Response snapshot

**Constitution updated to v1.2.0:**
- Added § VIII: Phase 4 Advanced Feature Governance (8 contracts: browser-local, offline-first, recurrence, analytics, tag uniqueness, priority enum, due date format)
- Extended § IV with locked Phase 4 stack: python-rrule, recharts, idb-keyval, next-pwa
- Extended § V with Phase 4 API endpoints and schema extensions
- Extended § VII MCP tool catalogue with get_stats, add_tag, tag_task; NL parsing examples for dates/priorities/tags/recurrence
- Updated config phase4-advanced-features catalogue
- Sync Impact Report documents all changes; all templates remain compatible

**8 spec files created (005–012):**
- 005: due_date column + DueDateBadge + DueDatePicker + overdue filter + NL date parsing via Cohere
- 006: Browser Notification API polling hook + permission button (no backend changes)
- 007: priority column (low/medium/high/urgent) + PriorityBadge + PrioritySelect + NL priority inference
- 008: tags + task_tags tables + TagChip + TagMultiSelect + add_tag/tag_task MCP tools
- 009: recurrence_rule column + python-dateutil RRULE parsing + auto next-occurrence on complete + RecurrenceSelect UI
- 010: GET /stats endpoint + get_stats MCP tool + recharts BarChart dashboard page
- 011: idb-keyval IndexedDB cache + write queue + next-pwa manifest + offline banner + useOnlineStatus hook
- 012: notes column + TaskNotesSection + FileText indicator + update_task/add_task notes param

## Outcome

- ✅ Impact: Constitution governs all Phase 4 work; 8 complete specs ready for plan/tasks/implement workflow
- 🧪 Tests: All files created and readable; no placeholder tokens left unresolved
- 📁 Files: 9 files created/updated (1 constitution + 8 specs)
- 🔁 Next prompts: /sp.plan for each feature; implement in dependency order (005→006, 005→007, 005→009, 010, 011, 008, 012)
- 🧠 Reflection: Phase 4 specs are fully self-contained with DB schemas, API contracts, MCP tool signatures, UI components, and constraints — minimal ambiguity for implementation agents

## Evaluation notes (flywheel)

- Failure modes observed: User prompt was cut off after "new" — inferred full intent from context (8 features named, tech stack listed, principles summarised)
- Graders run and results (PASS/FAIL): File existence check PASS (9 files); no placeholder tokens PASS
- Prompt variant (if applicable): Partially truncated user message; intent successfully inferred
- Next experiment: Generate tasks.md for feature 005 first (highest dependency) to unblock parallel implementation of 006/007/012
