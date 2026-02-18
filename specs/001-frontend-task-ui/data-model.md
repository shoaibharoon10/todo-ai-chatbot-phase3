# Data Model: Professional Frontend Task UI

**Branch**: `001-frontend-task-ui` | **Date**: 2026-02-12

## Frontend TypeScript Interfaces

These types represent the frontend's view of the data. The backend schema is defined in the constitution and is immutable.

### Task

```typescript
interface Task {
  id: number;
  user_id: string;
  title: string;
  description: string | null;
  completed: boolean;
  created_at: string;   // ISO 8601 datetime
  updated_at: string;   // ISO 8601 datetime
}
```

### Task Create Payload

```typescript
interface CreateTaskPayload {
  title: string;          // required, max 255 chars
  description?: string;   // optional
}
```

### Task Update Payload

```typescript
interface UpdateTaskPayload {
  title?: string;
  description?: string | null;
  completed?: boolean;
}
```

### User (from Better Auth session)

```typescript
interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
}
```

### Session

```typescript
interface Session {
  user: User;
  session: {
    token: string;   // JWT
    expiresAt: string;
  };
}
```

### API Error

```typescript
interface ApiError {
  status: number;
  detail: string;
}
```

## Zod Validation Schemas

### Login Form

```typescript
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
```

### Signup Form

```typescript
const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
```

### Create Task Form

```typescript
const createTaskSchema = z.object({
  title: z.string()
    .min(1, "Title is required")
    .max(255, "Title must be 255 characters or less"),
  description: z.string().max(1000).optional(),
});
```

### Edit Task Form

```typescript
const editTaskSchema = z.object({
  title: z.string()
    .min(1, "Title is required")
    .max(255, "Title must be 255 characters or less"),
  description: z.string().max(1000).nullable().optional(),
});
```

## State Transitions

```text
Task Status:
  pending (completed=false) ──toggle──▶ completed (completed=true)
  completed (completed=true) ──toggle──▶ pending (completed=false)

Auth State:
  unauthenticated ──login/signup──▶ authenticated
  authenticated ──logout/401──▶ unauthenticated

Theme State:
  light ──toggle──▶ dark
  dark ──toggle──▶ light
  (persisted in localStorage, restored on load)
```
