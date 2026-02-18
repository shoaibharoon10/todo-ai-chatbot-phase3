# Tasks: Backend Task API

**Input**: Design documents from `/specs/002-backend-task-api/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Not explicitly requested in spec. Tests are omitted. Manual curl-based verification at each checkpoint.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `backend/` at repository root (Python FastAPI)
- All paths are relative to `backend/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create backend project structure, install dependencies, configure environment

- [x] T001 Create backend directory structure: `backend/`, `backend/routes/`, `backend/routes/__init__.py`
- [x] T002 Create `backend/requirements.txt` with dependencies: fastapi>=0.115.0, uvicorn[standard]>=0.32.0, sqlmodel>=0.0.22, pyjwt>=2.9.0, python-dotenv>=1.0.0, psycopg2-binary>=2.9.0
- [x] T003 Create Python virtual environment in `backend/venv` and install dependencies from `backend/requirements.txt`
- [x] T004 [P] Create `backend/.env` with DATABASE_URL and BETTER_AUTH_SECRET values for local development
- [x] T005 [P] Create `backend/.env.example` with placeholder values (no secrets) for documentation
- [x] T006 [P] Create `backend/.gitignore` with Python-specific ignores (venv/, __pycache__/, .env, *.pyc)

**Checkpoint**: Backend project scaffolded with all dependencies installed, environment configured.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY endpoint can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T007 Create database engine and session dependency in `backend/db.py` — `create_engine(DATABASE_URL, pool_pre_ping=True, pool_size=5, max_overflow=10)`, `get_session` generator yielding SQLModel Session, load dotenv on import
- [x] T008 Create Task SQLModel class in `backend/models.py` — table="task", fields: id (int PK auto), user_id (str indexed not null), title (str not null max 200), description (str nullable max 1000), completed (bool default False), created_at (datetime default utcnow), updated_at (datetime default utcnow); also create Pydantic schemas: TaskCreate, TaskUpdate, TaskRead
- [x] T009 Create JWT authentication dependency in `backend/auth.py` — `get_current_user(authorization: str = Header(...))` that extracts Bearer token, calls `jwt.decode(token, BETTER_AUTH_SECRET, algorithms=["HS256"], issuer="taskflow-web", audience="taskflow-api")`, returns `payload["sub"]` as user_id, raises HTTPException 401 on any error (missing header, invalid token, expired, missing sub claim)
- [x] T010 Create FastAPI application entry point in `backend/main.py` — FastAPI app instance, CORSMiddleware with `allow_origins=["http://localhost:3000"]`, `allow_credentials=True`, `allow_methods=["*"]`, `allow_headers=["*"]`; SQLModel `create_all` on startup event to auto-create tables; include task router

**Checkpoint**: Foundation ready — database connected, JWT auth working, app entry point with CORS configured. Endpoint implementation can now begin.

---

## Phase 3: User Story 1 — JWT-Authenticated Task CRUD (Priority: P1) 🎯 MVP

**Goal**: Authenticated users can create, read, update, delete, and toggle tasks. All data scoped to the JWT user. Unauthenticated requests get 401.

**Independent Test**: Start backend with `uvicorn main:app --reload --port 8000`. Get JWT token from frontend login. Run `curl -H "Authorization: Bearer <token>" http://localhost:8000/api/tasks` — should return `[]` for new user.

### Implementation for User Story 1

- [x] T011 [US1] Create GET /api/tasks endpoint in `backend/routes/tasks.py` — APIRouter(prefix="/api"), Depends(get_current_user) for user_id, Depends(get_session) for db, query `SELECT * FROM task WHERE user_id = :user_id` ordered by created_at DESC, return list of TaskRead
- [x] T012 [US1] Create POST /api/tasks endpoint in `backend/routes/tasks.py` — accept TaskCreate body, set user_id from JWT, set created_at/updated_at to utcnow, add to session, commit, refresh, return TaskRead with status_code=201
- [x] T013 [US1] Create GET /api/tasks/{task_id} endpoint in `backend/routes/tasks.py` — query task by id AND user_id (ownership enforcement), raise 404 if not found, return TaskRead
- [x] T014 [US1] Create PUT /api/tasks/{task_id} endpoint in `backend/routes/tasks.py` — accept TaskUpdate body (all fields optional), query by id AND user_id, raise 404 if not found, update only provided fields, set updated_at to utcnow, return TaskRead
- [x] T015 [US1] Create DELETE /api/tasks/{task_id} endpoint in `backend/routes/tasks.py` — query by id AND user_id, raise 404 if not found, delete from session, commit, return 204 No Content
- [x] T016 [US1] Create PATCH /api/tasks/{task_id}/complete endpoint in `backend/routes/tasks.py` — query by id AND user_id, raise 404 if not found, toggle `completed = not completed`, set updated_at to utcnow, return TaskRead
- [x] T017 [US1] Register task router in `backend/main.py` — `app.include_router(task_router)`, verify all 6 endpoints appear at /docs

**Checkpoint**: Full CRUD operational — create, read, update, delete, toggle tasks with JWT auth. User isolation enforced. MVP complete.

---

## Phase 4: User Story 2 — Task Filtering and Sorting (Priority: P2)

**Goal**: GET /api/tasks supports ?status=all|pending|completed and ?sort=created|title query parameters.

**Independent Test**: Create multiple tasks (some completed). Run `GET /api/tasks?status=pending` — only pending tasks returned. Run `GET /api/tasks?sort=title` — tasks sorted alphabetically.

### Implementation for User Story 2

- [x] T018 [US2] Add status filter to GET /api/tasks in `backend/routes/tasks.py` — add `status: str = Query("all")` parameter, filter: if "pending" → `Task.completed == False`, if "completed" → `Task.completed == True`, if "all" → no filter; validate status value
- [x] T019 [US2] Add sort parameter to GET /api/tasks in `backend/routes/tasks.py` — add `sort: str = Query("newest")` parameter, sort: if "newest" → `Task.created_at.desc()`, if "oldest" → `Task.created_at.asc()`, if "title" → `Task.title.asc()`; default newest first

**Checkpoint**: Filtering and sorting working. Frontend dashboard filter/sort controls should work end-to-end.

---

## Phase 5: User Story 3 — Input Validation and Error Handling (Priority: P2)

**Goal**: Proper validation on all inputs with structured error responses. 422 for invalid data, 404 for missing resources.

**Independent Test**: Send `POST /api/tasks` with empty title → 422. Send `POST /api/tasks` with 201-char title → 422. Send `GET /api/tasks/99999` → 404.

### Implementation for User Story 3

- [x] T020 [US3] Add field validation to TaskCreate and TaskUpdate schemas in `backend/models.py` — title: `Field(min_length=1, max_length=200)`, description: `Field(max_length=1000, default=None)`; ensure Pydantic raises 422 with descriptive messages for violations
- [x] T021 [US3] Add generic error handler in `backend/main.py` — catch unhandled exceptions, return 500 with `{"detail": "Internal server error"}` (no stack trace or DB connection leak); ensure all HTTPException responses include `{"detail": "..."}` format

**Checkpoint**: Input validation and error handling complete. All error responses are structured JSON.

---

## Phase 6: User Story 4 — Database Connection and Schema (Priority: P1)

**Goal**: Backend connects to Neon PostgreSQL on startup, creates task table with proper indexes.

**Independent Test**: Start backend, verify task table exists in Neon database. Check indexes on user_id and completed columns.

### Implementation for User Story 4

- [x] T022 [US4] Add database indexes to Task model in `backend/models.py` — ensure `user_id` and `completed` fields have `index=True` in their Field definitions for SQLModel to create indexes via `create_all`
- [x] T023 [US4] Verify database connection and table creation on startup in `backend/main.py` — add lifespan event or startup event that calls `SQLModel.metadata.create_all(engine)`, log success message; handle connection failure gracefully with error log

**Checkpoint**: Database connected, task table created with indexes. Backend starts successfully against Neon.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final verification, frontend integration alignment, and edge case handling

- [x] T024 Update frontend `frontend/src/lib/api.ts` to use `/api/tasks` instead of `/api/{user_id}/tasks` — remove `getUserId()` calls from all API functions, change endpoints to `/api/tasks` and `/api/tasks/{taskId}` and `/api/tasks/{taskId}/complete`
- [x] T025 [P] Verify CORS works end-to-end — start both frontend (port 3000) and backend (port 8000), attempt API call from browser, confirm no CORS errors in console
- [x] T026 [P] Verify JWT token flow end-to-end — log in via frontend, inspect JWT token in DevTools, use token with curl against backend, confirm user_id extraction works
- [x] T027 Verify user isolation — create two user accounts, add tasks for each, confirm User A cannot see User B's tasks via API calls with different tokens
- [x] T028 Run quickstart.md validation — follow all steps in quickstart.md, verify complete CRUD flow works from frontend UI through backend to Neon database

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (needs dependencies installed, env configured)
- **US1 CRUD (Phase 3)**: Depends on Phase 2 — BLOCKS all other user stories
- **US2 Filtering (Phase 4)**: Depends on Phase 3 (needs GET /api/tasks endpoint to exist)
- **US3 Validation (Phase 5)**: Depends on Phase 2 (enhances existing models/handlers)
- **US4 Database (Phase 6)**: Depends on Phase 2 (refines existing db.py and models.py)
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1)**: Can start after Foundational — core CRUD, no other story dependencies
- **US2 (P2)**: Depends on US1 (extends the GET endpoint created in US1)
- **US3 (P2)**: Can start after Foundational — validation is independent of endpoint logic
- **US4 (P1)**: Can start after Foundational — database setup is independent

### Within Each User Story

- Models/schemas before endpoints
- Endpoints before integration
- Core logic before edge cases

### Parallel Opportunities

- T004 + T005 + T006 (env files + gitignore) — different files
- T018 + T019 NOT parallel (both modify same endpoint in routes/tasks.py)
- T020 + T021 NOT parallel (T020 modifies models.py, T021 modifies main.py — technically parallel but logically coupled)
- T025 + T026 (CORS verification + JWT verification) — different test concerns

---

## Implementation Strategy

### MVP First (User Stories 1 + 4 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 6: US4 Database (ensures table exists)
4. Complete Phase 3: US1 CRUD (core functionality)
5. **STOP and VALIDATE**: Full CRUD with JWT auth working
6. Demo-ready MVP

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US4 (Database) + US1 (CRUD) → Test independently → MVP!
3. US2 (Filtering/Sorting) → Test independently → Enhanced dashboard
4. US3 (Validation) → Test independently → Production-quality errors
5. Polish → Frontend integration + isolation verification → Demo-perfect

### Optimized Execution Order

Since US4 (database indexes) and US3 (validation) enhance files created in Phase 2, the most efficient order is:

1. Phase 1: Setup (T001-T006)
2. Phase 2: Foundational (T007-T010) — includes initial models and db
3. Phase 6: US4 (T022-T023) — refine indexes and startup
4. Phase 5: US3 (T020-T021) — add validation to models
5. Phase 3: US1 (T011-T017) — implement all endpoints
6. Phase 4: US2 (T018-T019) — add filtering/sorting
7. Phase 7: Polish (T024-T028) — frontend alignment and verification

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- US1 + US4 together form the MVP — prioritize completing both before polish
- Total tasks: 28 across 7 phases
