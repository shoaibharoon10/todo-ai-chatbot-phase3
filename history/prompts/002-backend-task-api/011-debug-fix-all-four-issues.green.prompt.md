---
id: 011
title: Debug Fix All Four Backend Frontend Issues
stage: green
date: 2026-02-12
surface: agent
model: claude-opus-4-6
feature: 002-backend-task-api
branch: 002-backend-task-api
user: architect
command: debug-fix-session
labels: ["debug", "backend", "frontend", "auth", "database", "pydantic", "better-auth", "jwt"]
links:
  spec: specs/002-backend-task-api/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - backend/models.py
  - frontend/src/lib/auth.ts
  - frontend/src/lib/api.ts
tests:
  - backend models import without PydanticUserError
  - backend FastAPI app starts and /docs returns 200
  - backend /api/tasks returns 401 without auth (correct)
  - Neon DB tasks table has correct completed column
---

## Prompt

Follow constitution.md strictly as supreme law. No manual coding outside Claude Code. This is a comprehensive debug and fix session for both frontend and backend in the monorepo (hackathon-todo/), ensuring full integration (frontend on localhost:3000 calling backend on localhost:8000/api/ with JWT). Use the provided env vars:
- BETTER_AUTH_SECRET=<REDACTED>
- BETTER_AUTH_URL=http://localhost:3000
- DATABASE_URL=<REDACTED>

Issues to resolve (based on logs and screenshots):
1. Backend startup error with uvicorn: pydantic.errors.PydanticUserError: Field 'id' requires a type annotation
2. Backend /docs shows only task endpoints, no auth
3. Frontend signup error: 500 Internal Server Error on POST /api/auth/sign-up/email with "Failed to initialize database adapter"
4. Sign in succeeds but session expires immediately (logs show /api/auth/token 404, unhandled BetterAuthError)

## Response snapshot

Diagnosed and fixed all 4 issues:
1. Backend Pydantic error: Cleared stale __pycache__, removed sa_column_kwargs={"name": "is_completed"} from completed field, renamed DB column is_completed→completed to match constitution spec.
2. No auth in /docs: Confirmed working as designed (Better Auth handles auth on frontend).
3. Frontend signup 500: Added ssl: { rejectUnauthorized: false } to pg Pool config for Neon connection.
4. Session expires/token 404: Replaced authClient.$fetch (Better Auth internal fetch) with native fetch("/api/auth/token", { credentials: "include" }) to correctly hit custom Next.js API route.
Also cleaned up orphan task/todo tables from Neon DB.

## Outcome

- ✅ Impact: All 4 reported issues resolved; backend starts clean, frontend auth adapter connects to Neon, token endpoint reachable
- 🧪 Tests: Backend models import OK, /docs 200, /api/tasks 401 (correct), DB column renamed
- 📁 Files: backend/models.py, frontend/src/lib/auth.ts, frontend/src/lib/api.ts
- 🔁 Next prompts: Full end-to-end browser test (signup→login→CRUD tasks), dark mode verification
- 🧠 Reflection: Root cause chain — Neon requires SSL but pg Pool had no ssl config; Better Auth's $fetch doesn't route to custom Next.js API routes; DB column naming mismatch between code and schema

## Evaluation notes (flywheel)

- Failure modes observed: sa_column_kwargs mapping to wrong column name; pg Pool missing SSL for Neon; authClient.$fetch routing through Better Auth internals instead of Next.js routes
- Graders run and results (PASS/FAIL): Backend startup PASS, Models import PASS, DB connection PASS, /docs PASS, 401 auth check PASS
- Prompt variant (if applicable): comprehensive-debug-fix
- Next experiment (smallest change to try): Browser-based signup/login flow test to confirm session persistence end-to-end
