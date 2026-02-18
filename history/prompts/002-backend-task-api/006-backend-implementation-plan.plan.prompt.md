---
id: 006
title: Backend Task API Implementation Plan
stage: plan
date: 2026-02-12
surface: agent
model: claude-opus-4-6
feature: 002-backend-task-api
branch: 002-backend-task-api
user: developer
command: /sp.plan
labels: ["backend", "fastapi", "jwt", "architecture", "plan"]
links:
  spec: specs/002-backend-task-api/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/002-backend-task-api/plan.md
  - specs/002-backend-task-api/research.md
  - specs/002-backend-task-api/data-model.md
  - specs/002-backend-task-api/contracts/api-endpoints.md
  - specs/002-backend-task-api/quickstart.md
tests:
  - Constitution check: 6/6 PASS (1 partial with documented justification)
---

## Prompt

Follow constitution.md strictly as supreme law. This is the planning phase for Phase II backend implementation (/backend/ folder). Backend Goals: Secure JWT auth (HS256, BETTER_AUTH_SECRET), Neon PostgreSQL via DATABASE_URL, user isolation via JWT sub claim, 6 REST endpoints under /api/tasks, SQLModel ORM, FastAPI framework. Generate architecture, data flow, risk mitigation, and phased task plan.

## Response snapshot

Generated comprehensive backend implementation plan with:
- Architecture diagram showing data flow from frontend through JWT verification to Neon PostgreSQL
- Critical finding: Frontend JWT plugin uses JWT_SECRET_KEY (not BETTER_AUTH_SECRET) — documented alignment requirement
- JWT issuer/audience verification (iss="taskflow-web", aud="taskflow-api") derived from frontend auth.ts
- 7 research decisions (PyJWT, psycopg2-binary, pool_pre_ping, Pydantic schemas, CORS, JWT claims, timestamps)
- SQLModel data model with Task entity, indexes, and Pydantic request/response schemas
- Full API contract for all 6 endpoints with request/response shapes and error codes
- 5 design decisions documented (flat models.py, no FK constraint, pool_pre_ping, PATCH toggle, 404 for unauthorized access)
- 5 risks identified with mitigations
- Quickstart guide for backend setup and testing

## Outcome

- ✅ Impact: Complete backend architecture ready for task generation and implementation
- 🧪 Tests: Constitution check 6/6 PASS, all research decisions resolved
- 📁 Files: 5 artifacts created (plan.md, research.md, data-model.md, contracts/api-endpoints.md, quickstart.md)
- 🔁 Next prompts: /sp.tasks to generate implementation task breakdown
- 🧠 Reflection: Critical JWT secret alignment issue discovered by reading frontend source code — would have caused auth failures if missed

## Evaluation notes (flywheel)

- Failure modes observed: PowerShell script parameter binding error (worked around manually)
- Graders run and results (PASS/FAIL): Constitution check PASS, all gates cleared
- Prompt variant (if applicable): /sp.plan with detailed backend requirements inline
- Next experiment (smallest change to try): Verify JWT token structure with actual frontend-generated token before implementation
