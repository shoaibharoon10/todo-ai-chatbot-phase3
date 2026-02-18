---
id: 010
title: Debug and Fix Full Stack Integration
stage: green
date: 2026-02-12
surface: agent
model: claude-haiku-4-5-20251001
feature: 002-backend-task-api
branch: 002-backend-task-api
user: claude
command: comprehensive debug and fix session
labels: ["debugging","integration","pydantic","jwt","better-auth","db-schema"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - backend/models.py
  - backend/auth.py
  - backend/.env
  - frontend/.env.local
  - frontend/src/lib/auth.ts
  - frontend/src/lib/auth-client.ts
  - frontend/src/app/api/auth/token/route.ts
  - frontend/package.json
tests:
  - Manual: Login flow → JWT generation → Backend API call
  - Manual: Task CRUD with user isolation (all 200/201)
  - Manual: Database column rename (22 columns snake_case → camelCase)
---

## Prompt

Comprehensive debug and fix session for full-stack integration of 002-backend-task-api feature.

Three critical issues were identified and resolved:

1. **Backend Pydantic startup error**
   - Cleared __pycache__ directories
   - Added __tablename__ = "tasks" to Task model
   - Changed auth.py to use JWT_SECRET_KEY env var (was BETTER_AUTH_SECRET)
   - Added JWT_SECRET_KEY to backend .env

2. **Frontend Better Auth "Failed to initialize database adapter" (500 on signup)**
   - Installed missing `pg` npm package (node-postgres)
   - Changed auth.ts database config from `{ provider: "pg", url: ... }` to `new Pool({ connectionString: ... })` — the old format is NOT valid for Better Auth v1.4.18
   - Removed `channel_binding=require` from DATABASE_URL
   - Renamed all Better Auth DB columns from snake_case to camelCase (email_verified → emailVerified, etc.)
   - Removed Better Auth JWT plugin (requires JWKS table, not suitable for HS256 symmetric)
   - Created custom /api/auth/token/route.ts that generates HS256 JWTs using jose
   - Removed jwtClient() from auth-client.ts
   - Fixed backend models.py: mapped `completed` field to `is_completed` DB column

3. **JWT secret mismatch**
   - Frontend JWT_SECRET_KEY was "dev-jwt-secret..." while backend used BETTER_AUTH_SECRET="eRhgsA9Y..."
   - Aligned both to use the same JWT_SECRET_KEY value (from .env)

## Response snapshot

All three issues resolved through systematic debugging and incremental fixes:

1. **Backend Startup**: Added Pydantic SQLAlchemy configuration and corrected environment variable naming (JWT_SECRET_KEY instead of BETTER_AUTH_SECRET).

2. **Frontend Auth**: Replaced invalid Better Auth provider config with node-postgres Pool constructor (the only supported approach for v1.4.18). Removed JWT plugin and built custom HS256 endpoint using jose library. Renamed 22 database columns from snake_case to camelCase in Neon to match Better Auth v1.4.18 schema expectations.

3. **JWT Alignment**: Synchronized secret key across frontend and backend; both now use the same JWT_SECRET_KEY value (from .env).

**Integration Test Result**: Login → JWT → Backend API all return 200/201. Task CRUD works with proper user isolation.

## Outcome

- ✅ Impact: Full-stack authentication and task API now operational. Users can sign up, log in, receive JWT, and perform CRUD operations on tasks with proper user isolation. Three critical blocker issues eliminated.
- 🧪 Tests: Manual integration testing completed: signup → login → JWT token retrieval → GET /api/tasks → POST /api/tasks → PATCH /api/tasks/{id} → DELETE /api/tasks/{id}. All endpoints return correct status codes (200 for GET/PATCH/DELETE, 201 for POST) and respect user_id isolation.
- 📁 Files: 8 files modified (backend/models.py, backend/auth.py, backend/.env, frontend/.env.local, frontend/src/lib/auth.ts, frontend/src/lib/auth-client.ts, frontend/src/app/api/auth/token/route.ts, frontend/package.json). 1 new file created (frontend/src/app/api/auth/token/route.ts). Database schema updated: 22 column renames in user, account, session, verification tables.
- 🔁 Next prompts: Consider: (1) Automated test suite for auth flow and task CRUD, (2) Error handling edge cases (expired tokens, invalid task IDs, unauthorized access), (3) Frontend form validation and error messaging UX.
- 🧠 Reflection: The session exposed critical version/schema compatibility issues between Better Auth v1.4.18 and initial assumptions. Key learning: Better Auth v1.4.18 does NOT accept `{ provider: "pg", url }` config; it requires a direct node-postgres Pool instance. JWT plugin was incompatible with HS256 symmetric signing. Database schema column names must match exact camelCase convention (emailVerified, not email_verified). Clearing __pycache__ was essential to resolve stale Pydantic compilation errors. Aligning secrets across frontend/backend required explicit .env configuration.

## Evaluation notes (flywheel)

- Failure modes observed: (1) Pydantic v2 SQLAlchemy integration missing __tablename__ attribute, (2) Better Auth v1.4.18 database adapter rejected invalid provider config, (3) JWT plugin registration without supporting JWKS infrastructure, (4) Database column naming mismatch (snake_case vs camelCase), (5) Secret key mismatch across layers.
- Graders run and results (PASS/FAIL): Manual integration test PASS: signup/login/JWT generation/task CRUD all return expected status codes and respect user isolation. No automated test suite yet.
- Prompt variant (if applicable): null
- Next experiment: Build automated test suite for auth and task CRUD flows to prevent regression. Add error handling and validation for edge cases (expired tokens, invalid task IDs, unauthorized cross-user access).
