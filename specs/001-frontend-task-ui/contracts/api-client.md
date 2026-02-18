# API Client Contract: Frontend → Backend

**Branch**: `001-frontend-task-ui` | **Date**: 2026-02-12

## Base Configuration

- **Base URL**: `NEXT_PUBLIC_API_URL` env var (default: `http://localhost:8000`)
- **Auth**: All requests attach `Authorization: Bearer <jwt>` header
- **Content-Type**: `application/json`
- **Error handling**: 401 → sign out + redirect to `/login`; all others → throw ApiError

## Endpoints Consumed

All endpoints are per-constitution (Principle V: API-First Design).

### List Tasks

```
GET /api/{user_id}/tasks?status={status}&sort={sort}
Authorization: Bearer <jwt>

Query params:
  status?: "pending" | "completed"    (optional filter)
  sort?: "newest" | "oldest"          (optional sort, default newest)

Response 200:
  Task[]

Response 401:
  { "detail": "Invalid authentication token." }
```

### Create Task

```
POST /api/{user_id}/tasks
Authorization: Bearer <jwt>
Content-Type: application/json

Body:
  { "title": string, "description"?: string }

Response 201:
  Task

Response 422:
  { "detail": "Validation error message" }
```

### Get Single Task

```
GET /api/{user_id}/tasks/{id}
Authorization: Bearer <jwt>

Response 200:
  Task

Response 404:
  { "detail": "Task not found." }
```

### Update Task

```
PUT /api/{user_id}/tasks/{id}
Authorization: Bearer <jwt>
Content-Type: application/json

Body:
  { "title"?: string, "description"?: string | null, "completed"?: boolean }

Response 200:
  Task
```

### Delete Task

```
DELETE /api/{user_id}/tasks/{id}
Authorization: Bearer <jwt>

Response 204:
  (no content)
```

### Toggle Completion

```
PATCH /api/{user_id}/tasks/{id}/complete
Authorization: Bearer <jwt>

Response 200:
  Task   (with toggled completed field)
```

## Frontend API Client Methods

```typescript
// lib/api.ts exports:
getTasks(userId: string, filters?: { status?: string; sort?: string }): Promise<Task[]>
getTask(userId: string, id: number): Promise<Task>
createTask(userId: string, payload: CreateTaskPayload): Promise<Task>
updateTask(userId: string, id: number, payload: UpdateTaskPayload): Promise<Task>
deleteTask(userId: string, id: number): Promise<void>
toggleTask(userId: string, id: number): Promise<Task>
```

## Error Handling Contract

| HTTP Status | Frontend Behavior |
|-------------|-------------------|
| 200/201 | Parse JSON, return typed response |
| 204 | Return undefined (delete success) |
| 401 | Sign out via Better Auth, redirect to `/login`, show toast |
| 403 | Show "Access denied" toast |
| 404 | Show "Not found" toast |
| 422 | Show validation error toast with detail message |
| 500 | Show "Server error" toast with retry suggestion |
| Network error | Show "Connection failed" toast |
