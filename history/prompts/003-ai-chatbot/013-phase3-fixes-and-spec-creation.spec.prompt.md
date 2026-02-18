---
id: 013
title: Phase 3 Fixes and Spec Creation
stage: spec
date: 2026-02-18
surface: agent
model: claude-opus-4-6
feature: 003-ai-chatbot
branch: 002-backend-task-api
user: architect
command: spec-creation
labels: ["phase3", "chatbot", "cohere", "spec", "fixes", "infrastructure"]
links:
  spec: specs/003-ai-chatbot/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - .spec-kit/config.yaml
  - frontend/CLAUDE.md
  - backend/CLAUDE.md
  - docker-compose.yml
  - README.md
  - specs/003-ai-chatbot/spec.md
  - specs/002-backend-task-api/data-model.md
  - backend/.env.example
tests:
  - N/A (infrastructure and spec creation, no code tests)
---

## Prompt

Resolve the critical issues identified in the project analysis and initiate Phase 3 (AI Chatbot) implementation following the updated constitution v1.1.0.

1. Fix Missing Files and Deviations: Create .spec-kit/config.yaml, frontend/CLAUDE.md, backend/CLAUDE.md, docker-compose.yml, root README.md. Update stale docs (data-model.md table name, .env.example with CO_API_KEY). Delete replacements.txt.
2. Create Phase 3 Spec (003-ai-chatbot): Full feature specification with 8 user stories, 20 functional requirements, MCP tool definitions, DB schema additions, API contract, edge cases, and success criteria.

## Response snapshot

All fixes applied and Phase 3 spec created:

**Files Created (6)**:
- `.spec-kit/config.yaml` — Project phases config (phase1-console, phase2-web, phase3-chatbot)
- `frontend/CLAUDE.md` — Frontend dev guidelines with Phase 3 chat UI conventions
- `backend/CLAUDE.md` — Backend dev guidelines with Cohere integration conventions
- `docker-compose.yml` — Docker services for frontend (3000) and backend (8000)
- `README.md` — Project overview with all 3 phases and setup instructions
- `specs/003-ai-chatbot/spec.md` — Full Phase 3 feature specification

**Files Updated (2)**:
- `specs/002-backend-task-api/data-model.md` — Fixed table name: `task` -> `tasks`
- `backend/.env.example` — Added `CO_API_KEY` placeholder

**Files Deleted (1)**:
- `replacements.txt` — Removed untracked secrets redaction file

**Spec Summary (003-ai-chatbot)**:
- 8 user stories (P1: add/list/complete tasks + chat UI; P2: delete/update/multi-step; P3: persistence)
- 20 functional requirements covering chat endpoint, MCP tools, Cohere integration, frontend UI
- 5 MCP tools: add_task, list_tasks, complete_task, delete_task, update_task
- 2 new DB tables: conversations, messages
- Full API contract for POST /api/{user_id}/chat
- 10 success criteria, 9 edge cases, 7 assumptions

## Outcome

- Impact: Project infrastructure aligned with constitution v1.1.0; Phase 3 spec ready for planning
- Tests: N/A (no code changes)
- Files: 6 created, 2 updated, 1 deleted
- Next prompts: Generate implementation plan: `/sp.plan` for 003-ai-chatbot
- Reflection: Clean separation between infrastructure fixes and spec creation; spec follows Spec-Kit template precisely

## Evaluation notes (flywheel)

- Failure modes observed: None
- Graders run and results (PASS/FAIL): Manual review PASS — all missing files created, spec follows template, constitution alignment verified
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): Run /sp.plan to generate architecture plan from the spec
