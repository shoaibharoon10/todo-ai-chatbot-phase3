# API Contract: Backend Task Endpoints

**Base URL**: `http://localhost:8000`
**Auth**: All endpoints require `Authorization: Bearer <jwt-token>` header

## Authentication

All requests must include:
```
Authorization: Bearer <jwt-token>
```

The JWT is verified with:
- Algorithm: HS256
- Secret: `BETTER_AUTH_SECRET` env var (must match frontend's `JWT_SECRET_KEY`)
- Required claims: `sub` (user_id), `iss` ("taskflow-web"), `aud` ("taskflow-api")
- Expiry: Enforced by PyJWT (30m tokens from frontend)

**Error**: Missing/invalid/expired token → `401 {"detail": "Invalid or expired token"}`

---

## Endpoints

### GET /api/tasks

List all tasks for the authenticated user.

**Query Parameters**:

| Parameter | Type | Values | Default |
|-----------|------|--------|---------|
| status | string | all, pending, completed | all |
| sort | string | created, title | created (newest first) |

**Response**: `200 OK`
```json
[
  {
    "id": 1,
    "user_id": "abc123",
    "title": "My Task",
    "description": "Details here",
    "completed": false,
    "created_at": "2026-02-12T10:00:00",
    "updated_at": "2026-02-12T10:00:00"
  }
]
```

**Empty result**: `200 OK` with `[]`

---

### POST /api/tasks

Create a new task for the authenticated user.

**Request Body**:
```json
{
  "title": "My Task",
  "description": "Optional details"
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| title | string | Yes | 1-200 characters |
| description | string | No | Max 1000 characters |

**Response**: `201 Created`
```json
{
  "id": 1,
  "user_id": "abc123",
  "title": "My Task",
  "description": "Optional details",
  "completed": false,
  "created_at": "2026-02-12T10:00:00",
  "updated_at": "2026-02-12T10:00:00"
}
```

**Validation Error**: `422 Unprocessable Entity`
```json
{
  "detail": [
    {
      "loc": ["body", "title"],
      "msg": "String should have at least 1 character",
      "type": "string_too_short"
    }
  ]
}
```

---

### GET /api/tasks/{task_id}

Get a single task by ID (must be owned by authenticated user).

**Path Parameters**: `task_id` (integer)

**Response**: `200 OK` — single task object (same shape as list item)

**Not Found / Not Owned**: `404 {"detail": "Task not found"}`

---

### PUT /api/tasks/{task_id}

Update a task (must be owned by authenticated user).

**Request Body**:
```json
{
  "title": "Updated title",
  "description": "Updated description",
  "completed": true
}
```

All fields are optional. Only provided fields are updated.

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| title | string | No | 1-200 characters if provided |
| description | string \| null | No | Max 1000 chars; null to clear |
| completed | boolean | No | |

**Response**: `200 OK` — updated task object

**Not Found**: `404 {"detail": "Task not found"}`

---

### DELETE /api/tasks/{task_id}

Delete a task (must be owned by authenticated user).

**Response**: `204 No Content` (empty body)

**Not Found**: `404 {"detail": "Task not found"}`

---

### PATCH /api/tasks/{task_id}/complete

Toggle the completed status of a task.

**Request Body**: None

**Response**: `200 OK` — updated task object with `completed` flipped

**Not Found**: `404 {"detail": "Task not found"}`

---

## Error Responses

| Status | Meaning | When |
|--------|---------|------|
| 401 | Unauthorized | Missing, invalid, expired, or malformed JWT |
| 404 | Not Found | Task doesn't exist or not owned by user |
| 422 | Unprocessable Entity | Validation failed (title/description constraints) |
| 500 | Internal Server Error | Database connection error (generic message) |

## Frontend Integration Notes

The frontend `lib/api.ts` currently calls `/api/{user_id}/tasks` (constitution Principle V pattern). It must be updated to call `/api/tasks` instead, since the backend extracts user_id from the JWT token. Affected functions:
- `getTasks()` → `GET /api/tasks`
- `getTask(taskId)` → `GET /api/tasks/{taskId}`
- `createTask(payload)` → `POST /api/tasks`
- `updateTask(taskId, payload)` → `PUT /api/tasks/{taskId}`
- `deleteTask(taskId)` → `DELETE /api/tasks/{taskId}`
- `toggleTask(taskId)` → `PATCH /api/tasks/{taskId}/complete`
