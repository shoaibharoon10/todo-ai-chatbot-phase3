---
id: 005
title: Backend Task API Spec Creation
stage: spec
date: 2026-02-12
surface: agent
model: claude-opus-4-6
feature: 002-backend-task-api
branch: 002-backend-task-api
user: developer
command: /sp.specify
labels: ["backend", "fastapi", "jwt", "crud", "spec"]
links:
  spec: specs/002-backend-task-api/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/002-backend-task-api/spec.md
  - specs/002-backend-task-api/checklists/requirements.md
tests:
  - Specification quality checklist: 16/16 PASS
---

## Prompt

Follow constitution.md strictly as supreme law. No manual coding outside Claude Code. Now focus ONLY on backend implementation (/backend/ folder) in the monorepo (hackathon-todo/). Frontend is already complete and running on http://localhost:3000. Do NOT touch frontend code, specs, or files.

Backend Requirements (Phase II full integration):
- Use Python FastAPI as backend framework.
- ORM: SQLModel for all DB operations.
- Database: Neon Serverless PostgreSQL
- Authentication: Secure all API endpoints with JWT verification using shared secret from env var BETTER_AUTH_SECRET
- JWT details: HS256 symmetric algorithm (PyJWT), decode token to extract user_id (sub claim)
- Endpoints: GET/POST /api/tasks, GET/PUT/DELETE /api/tasks/{task_id}, PATCH /api/tasks/{task_id}/complete
- All endpoints require Authorization: Bearer <token> header
- Filter EVERY query by user_id from decoded JWT
- Models: SQLModel Task with id, user_id, title, description, completed, created_at, updated_at
- Error handling: HTTPException for 401, 403, 404, 422
- Project structure: main.py, db.py, models.py, routes/tasks.py, auth.py

## Response snapshot

Created backend task API specification with:
- 4 user stories (P1: JWT-Authenticated CRUD, P1: Database Schema, P2: Filtering/Sorting, P2: Validation/Errors)
- 20 functional requirements (FR-001 through FR-020)
- 8 success criteria (SC-001 through SC-008)
- 6 edge cases documented
- Assumptions section clarifying JWT secret alignment and FK constraints
- Endpoint Contract Note documenting deviation from constitution Principle V (/api/tasks vs /api/{user_id}/tasks)
- Quality checklist: 16/16 items passing

## Outcome

- ✅ Impact: Backend spec ready for planning phase — defines complete API contract for frontend integration
- 🧪 Tests: Quality checklist 16/16 PASS, no NEEDS CLARIFICATION markers
- 📁 Files: 2 files created (spec.md, checklists/requirements.md)
- 🔁 Next prompts: /sp.plan to generate implementation plan, then /sp.tasks for task breakdown
- 🧠 Reflection: User requirements for /api/tasks (JWT-only) differ from constitution /api/{user_id}/tasks — documented as de facto amendment

## Evaluation notes (flywheel)

- Failure modes observed: PowerShell script parameter binding error on long descriptions (worked around)
- Graders run and results (PASS/FAIL): Spec quality checklist PASS (16/16)
- Prompt variant (if applicable): /sp.specify with inline backend requirements
- Next experiment (smallest change to try): Formally amend constitution Principle V for API path convention
