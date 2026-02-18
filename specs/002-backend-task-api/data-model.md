# Data Model: Backend Task API

**Feature**: 002-backend-task-api | **Date**: 2026-02-12

## Entities

### Task (SQLModel table)

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | int | Primary Key, auto-increment | Database-generated |
| user_id | str | Not null, indexed | Better Auth user ID from JWT `sub` claim |
| title | str | Not null, 1-200 chars | Validated at API layer via Pydantic |
| description | str \| None | Nullable, max 1000 chars | Optional task details |
| completed | bool | Not null, default False | Toggled via PATCH endpoint |
| created_at | datetime | Not null, auto-set | UTC timestamp, set on creation |
| updated_at | datetime | Not null, auto-set | UTC timestamp, updated on every modification |

**Indexes**:
- `ix_task_user_id` on `user_id` — fast user-scoped queries
- `ix_task_completed` on `completed` — fast status filtering

**Table name**: `tasks` (set via `__tablename__ = "tasks"` in SQLModel)

### User (reference only — managed by Better Auth)

The `user` table is created and managed by Better Auth on the frontend. The backend does NOT create, modify, or query this table. User identity is derived exclusively from JWT token `sub` claims. No foreign key constraint exists between `task.user_id` and the Better Auth user table.

## Pydantic Request/Response Schemas

### TaskCreate (POST /api/tasks request body)

```
title: str          # Required, 1-200 characters
description: str?   # Optional, max 1000 characters
```

### TaskUpdate (PUT /api/tasks/{task_id} request body)

```
title: str?         # Optional, 1-200 characters if provided
description: str?   # Optional, max 1000 characters if provided, null to clear
completed: bool?    # Optional, set completion status directly
```

### TaskRead (all response bodies)

```
id: int
user_id: str
title: str
description: str | None
completed: bool
created_at: str     # ISO 8601 datetime string
updated_at: str     # ISO 8601 datetime string
```

## State Transitions

```
Task lifecycle:
  Created (POST) → completed=False, created_at=now, updated_at=now
  Updated (PUT)  → fields changed, updated_at=now
  Toggled (PATCH /complete) → completed flipped, updated_at=now
  Deleted (DELETE) → permanently removed
```

## Relationships

```
User (1) ──── has many ───→ Task (N)
  │                            │
  │ Better Auth managed        │ Backend managed
  │ JWT sub = user_id          │ user_id = JWT sub
```
