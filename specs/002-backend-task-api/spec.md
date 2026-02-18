# Feature Specification: Backend Task API

**Feature Branch**: `002-backend-task-api`
**Created**: 2026-02-12
**Status**: Draft
**Input**: User description: "Backend FastAPI implementation with JWT auth, SQLModel ORM, Neon PostgreSQL, full CRUD task endpoints"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - JWT-Authenticated Task CRUD (Priority: P1)

An authenticated user (who has signed up and logged in via the frontend) sends API requests with a Bearer JWT token. The backend verifies the token using the shared HS256 secret, extracts the user's identity from the `sub` claim, and allows them to create, read, update, and delete their own tasks. All data is scoped to the authenticated user — no user can access another user's tasks.

**Why this priority**: This is the core MVP — without authenticated CRUD, the entire application is non-functional. The frontend is already built and waiting for these endpoints.

**Independent Test**: Start the backend with `uvicorn main:app --reload --port 8000`. Use a valid JWT token from the frontend login flow. Send `curl -H "Authorization: Bearer <token>" http://localhost:8000/api/tasks` and verify the response contains only the authenticated user's tasks.

**Acceptance Scenarios**:

1. **Given** a user has a valid JWT token, **When** they send `POST /api/tasks` with `{"title": "My Task"}`, **Then** the system creates the task scoped to the user's ID and returns the task with a 201 status.
2. **Given** a user has tasks in the database, **When** they send `GET /api/tasks`, **Then** the system returns only their tasks (not other users') with a 200 status.
3. **Given** a user owns a task, **When** they send `PUT /api/tasks/{task_id}` with updated fields, **Then** the task is updated and returned with a 200 status.
4. **Given** a user owns a task, **When** they send `DELETE /api/tasks/{task_id}`, **Then** the task is permanently removed and a 204 status is returned.
5. **Given** a user owns a task, **When** they send `PATCH /api/tasks/{task_id}/complete`, **Then** the task's completed status is toggled and the updated task is returned.
6. **Given** a request with no token or an invalid/expired token, **When** any endpoint is called, **Then** the system returns 401 Unauthorized.
7. **Given** User A's token, **When** they try to access/modify User B's task by ID, **Then** the system returns 404 Not Found (task not found for this user).

---

### User Story 2 - Task Filtering and Sorting (Priority: P2)

An authenticated user can filter their tasks by completion status (all, pending, completed) and sort them by creation date or title. This enables the frontend dashboard's filter and sort controls to work correctly.

**Why this priority**: Filtering and sorting are essential for usability but the app functions without them (showing all tasks unfiltered is acceptable for MVP).

**Independent Test**: Create multiple tasks with different completion statuses. Send `GET /api/tasks?status=pending&sort=title` and verify only pending tasks are returned, sorted alphabetically by title.

**Acceptance Scenarios**:

1. **Given** a user has both pending and completed tasks, **When** they send `GET /api/tasks?status=pending`, **Then** only pending tasks are returned.
2. **Given** a user has both pending and completed tasks, **When** they send `GET /api/tasks?status=completed`, **Then** only completed tasks are returned.
3. **Given** a user has multiple tasks, **When** they send `GET /api/tasks?sort=title`, **Then** tasks are returned sorted alphabetically by title.
4. **Given** a user has multiple tasks, **When** they send `GET /api/tasks?sort=created`, **Then** tasks are returned sorted by creation date (newest first by default).
5. **Given** no filter parameters, **When** they send `GET /api/tasks`, **Then** all tasks are returned sorted by newest first (default).

---

### User Story 3 - Input Validation and Error Handling (Priority: P2)

The API validates all incoming data and returns structured error responses. Title is required (1-200 chars), description is optional (max 1000 chars). Invalid requests receive 422 with descriptive error messages. Non-existent resources return 404.

**Why this priority**: Proper validation prevents data corruption and gives the frontend meaningful error messages to display.

**Independent Test**: Send `POST /api/tasks` with an empty title and verify a 422 response with a clear error message. Send `GET /api/tasks/99999` for a non-existent task and verify 404.

**Acceptance Scenarios**:

1. **Given** a valid token, **When** sending `POST /api/tasks` with an empty title, **Then** the system returns 422 with a validation error message.
2. **Given** a valid token, **When** sending `POST /api/tasks` with a title exceeding 200 characters, **Then** the system returns 422.
3. **Given** a valid token, **When** sending `GET /api/tasks/99999` (non-existent), **Then** the system returns 404 with `{"detail": "Task not found"}`.
4. **Given** a valid token, **When** sending `PUT /api/tasks/{id}` with a description exceeding 1000 characters, **Then** the system returns 422.

---

### User Story 4 - Database Connection and Schema (Priority: P1)

The backend connects to the Neon Serverless PostgreSQL database using the `DATABASE_URL` environment variable. On startup, it creates the `task` table if it doesn't exist. The table has proper indexes on `user_id` and `completed` for fast filtering.

**Why this priority**: Without a database connection, no data can be persisted. This is foundational infrastructure.

**Independent Test**: Start the backend, check that the `task` table exists in the database with the correct schema. Verify the connection string uses SSL as required by Neon.

**Acceptance Scenarios**:

1. **Given** a valid `DATABASE_URL`, **When** the backend starts, **Then** it connects to the database and creates the `task` table if it doesn't exist.
2. **Given** the `task` table exists, **When** inspecting the schema, **Then** it has columns: id (integer primary key), user_id (string), title (string not null), description (string nullable), completed (boolean default false), created_at (timestamp), updated_at (timestamp).
3. **Given** the `task` table exists, **When** inspecting indexes, **Then** indexes exist on `user_id` and `completed`.

---

### Edge Cases

- What happens when the JWT token is well-formed but signed with a different secret? The system returns 401 Unauthorized.
- What happens when the `sub` claim is missing from the JWT? The system returns 401 Unauthorized.
- What happens when the database is unreachable? The system returns 500 Internal Server Error with a generic message (no connection string leak).
- What happens when two users create tasks with the same title? Both succeed — titles are not unique per user.
- What happens when a task's `completed` field is toggled twice? It returns to its original state (toggle is idempotent per call).
- What happens when a user has zero tasks and calls GET /api/tasks? The system returns 200 with an empty array `[]`.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST verify JWT tokens using HS256 algorithm with the `BETTER_AUTH_SECRET` environment variable as the shared secret.
- **FR-002**: System MUST extract the `sub` claim from decoded JWTs as the authenticated `user_id`.
- **FR-003**: System MUST return 401 Unauthorized for requests with missing, invalid, malformed, or expired JWT tokens.
- **FR-004**: System MUST filter ALL database queries by the authenticated `user_id` — no cross-user data access is permitted.
- **FR-005**: System MUST provide `GET /api/tasks` endpoint returning all tasks for the authenticated user.
- **FR-006**: System MUST provide `POST /api/tasks` endpoint to create a new task for the authenticated user, returning 201 Created.
- **FR-007**: System MUST provide `GET /api/tasks/{task_id}` endpoint returning a single task owned by the authenticated user.
- **FR-008**: System MUST provide `PUT /api/tasks/{task_id}` endpoint to update a task owned by the authenticated user.
- **FR-009**: System MUST provide `DELETE /api/tasks/{task_id}` endpoint to delete a task, returning 204 No Content.
- **FR-010**: System MUST provide `PATCH /api/tasks/{task_id}/complete` endpoint to toggle the completed status of a task.
- **FR-011**: System MUST support `status` query parameter on list endpoint (values: all, pending, completed).
- **FR-012**: System MUST support `sort` query parameter on list endpoint (values: created, title; default: newest first).
- **FR-013**: System MUST validate that task title is between 1 and 200 characters.
- **FR-014**: System MUST validate that task description, when provided, does not exceed 1000 characters.
- **FR-015**: System MUST return 404 when a task is not found or not owned by the authenticated user (no information leakage).
- **FR-016**: System MUST auto-set `created_at` on task creation and update `updated_at` on every modification.
- **FR-017**: System MUST connect to Neon PostgreSQL using the `DATABASE_URL` environment variable with SSL.
- **FR-018**: System MUST create database tables on startup if they don't exist.
- **FR-019**: System MUST enable CORS for the frontend origin (`http://localhost:3000`).
- **FR-020**: System MUST return JSON responses for all endpoints with appropriate Content-Type headers.

### Key Entities

- **Task**: Represents a single todo item. Attributes: id (unique identifier), user_id (owner reference), title (display name), description (optional details), completed (status flag), created_at (creation timestamp), updated_at (last modification timestamp). A task belongs to exactly one user.
- **User**: Managed by Better Auth on the frontend. The backend only references the user's ID extracted from JWT tokens. No user management endpoints are needed in the backend.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All 6 API endpoints respond correctly with proper status codes when called with a valid JWT token.
- **SC-002**: Unauthenticated requests to any endpoint receive 401 within 100ms.
- **SC-003**: User A cannot access, modify, or delete User B's tasks under any combination of API calls.
- **SC-004**: Task creation, retrieval, update, toggle, and deletion complete within 500ms per operation.
- **SC-005**: Filtering by status returns only matching tasks; sorting returns tasks in the correct order.
- **SC-006**: Invalid input (empty title, oversized description) receives 422 with a descriptive error message.
- **SC-007**: The backend starts successfully and connects to the Neon database within 5 seconds.
- **SC-008**: The frontend can perform full CRUD operations through the backend API when both services are running.

## Assumptions

- The Better Auth `user` table already exists in the Neon database (created by the frontend's Better Auth setup).
- The JWT `sub` claim contains the Better Auth user ID as a string.
- The frontend sends tokens in the `Authorization: Bearer <token>` header format.
- The `BETTER_AUTH_SECRET` environment variable value is used as the JWT signing secret (matching the frontend's JWT plugin configuration).
- Default sort order is newest first (descending `created_at`) when no sort parameter is specified.
- The `task` table does NOT have a foreign key constraint to the `user` table (since Better Auth's table structure may vary) — user isolation is enforced at the application layer via JWT verification.

## Endpoint Contract Note

The user's requirements specify `/api/tasks` (no `{user_id}` in URL path) with user identification exclusively via JWT token. This differs from the constitution's Principle V which specifies `/api/{user_id}/tasks`. The JWT-only approach is adopted here because the user explicitly requested it in the latest requirements, and JWT-only user identification is more secure (no URL parameter to spoof). The frontend `api.ts` will need a corresponding update to use `/api/tasks` instead of `/api/{user_id}/tasks`.
