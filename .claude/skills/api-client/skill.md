---
name: Centralized API Client
description: Create API client in frontend with JWT.
trigger: create api client
---

# Centralized API Client Skill

## Purpose

Create a single, centralized API client at `lib/api.ts` that handles all communication between the Next.js frontend and the FastAPI backend. Every outgoing request automatically retrieves the JWT from the Better Auth session and attaches it as a Bearer token. All error handling, including 401 token expiry, is managed in one place.

## Instructions

When triggered, execute the following steps in order:

### Step 1: Environment Setup

Ensure `.env.local` contains:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Step 2: Write `lib/api.ts`

Create the centralized API client:

```typescript
import { authClient } from "@/lib/auth-client";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface ApiError {
  status: number;
  detail: string;
}

interface FetchOptions extends Omit<RequestInit, "body" | "headers"> {
  headers?: Record<string, string>;
  body?: unknown;
}

// ---------------------------------------------------------------------------
// Token retrieval
// ---------------------------------------------------------------------------
async function getToken(): Promise<string | null> {
  try {
    const { data: tokenData } = await authClient.$fetch("/api/auth/token", {
      method: "GET",
    });
    return tokenData?.token ?? null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Core fetch wrapper
// ---------------------------------------------------------------------------
async function request<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const token = await getToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  if (options.body !== undefined) {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, config);

  // --- 401: token expired or invalid ---
  if (response.status === 401) {
    await authClient.signOut();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw { status: 401, detail: "Session expired. Redirecting to login." } as ApiError;
  }

  // --- 204: no content ---
  if (response.status === 204) {
    return undefined as T;
  }

  // --- Other errors ---
  if (!response.ok) {
    const body = await response.json().catch(() => ({ detail: "Request failed." }));
    throw {
      status: response.status,
      detail: body.detail || `Unexpected error (${response.status}).`,
    } as ApiError;
  }

  return response.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Public API methods
// ---------------------------------------------------------------------------

// ---- Tasks ----------------------------------------------------------------
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: "pending" | "in_progress" | "completed";
  created_at: string;
  updated_at: string;
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  status?: "pending" | "in_progress" | "completed";
}

export function getTasks(): Promise<Task[]> {
  return request<Task[]>("/api/tasks");
}

export function getTask(id: string): Promise<Task> {
  return request<Task>(`/api/tasks/${id}`);
}

export function createTask(payload: CreateTaskPayload): Promise<Task> {
  return request<Task>("/api/tasks", {
    method: "POST",
    body: payload,
  });
}

export function updateTask(id: string, payload: UpdateTaskPayload): Promise<Task> {
  return request<Task>(`/api/tasks/${id}`, {
    method: "PATCH",
    body: payload,
  });
}

export function deleteTask(id: string): Promise<void> {
  return request<void>(`/api/tasks/${id}`, {
    method: "DELETE",
  });
}

// ---- User Profile ---------------------------------------------------------
export interface UserProfile {
  id: string;
  email: string;
  name: string;
}

export function getProfile(): Promise<UserProfile> {
  return request<UserProfile>("/api/users/me");
}

// ---------------------------------------------------------------------------
// Generic helpers (for extending with new resources)
// ---------------------------------------------------------------------------
export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint, { method: "GET" }),
  post: <T>(endpoint: string, body: unknown) => request<T>(endpoint, { method: "POST", body }),
  put: <T>(endpoint: string, body: unknown) => request<T>(endpoint, { method: "PUT", body }),
  patch: <T>(endpoint: string, body: unknown) => request<T>(endpoint, { method: "PATCH", body }),
  delete: <T>(endpoint: string) => request<T>(endpoint, { method: "DELETE" }),
};
```

### Step 3: Usage in Components

#### Fetching tasks in a Client Component

```typescript
"use client";

import { getTasks, type Task } from "@/lib/api";
import { useEffect, useState } from "react";

export function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getTasks()
      .then(setTasks)
      .catch((err) => setError(err.detail));
  }, []);

  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <ul>
      {tasks.map((task) => (
        <li key={task.id}>{task.title}</li>
      ))}
    </ul>
  );
}
```

#### Creating a task

```typescript
import { createTask } from "@/lib/api";

async function handleCreate(title: string) {
  const task = await createTask({ title });
  // task is typed as Task
}
```

#### Using the generic helpers for new endpoints

```typescript
import { api } from "@/lib/api";

interface Project {
  id: string;
  name: string;
}

// No need to write a new function — use the generic helper
const projects = await api.get<Project[]>("/api/projects");
const created = await api.post<Project>("/api/projects", { name: "New Project" });
```

#### Handling errors

```typescript
import { createTask, type ApiError } from "@/lib/api";

try {
  await createTask({ title: "New task" });
} catch (err) {
  const apiErr = err as ApiError;
  if (apiErr.status === 422) {
    // Validation error from backend
  }
  console.error(apiErr.detail);
}
```

### Step 4: Server Component Usage

For Server Components, pass the token manually since `authClient` is client-side only:

```typescript
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const API_BASE = process.env.API_URL || "http://localhost:8000";

export async function getTasksServer(): Promise<Task[]> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE}/api/tasks`, {
    headers: {
      Authorization: `Bearer ${session.session.token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) throw new Error("Failed to fetch tasks");
  return res.json();
}
```

## File Output

| File | Action | Description |
|---|---|---|
| `lib/api.ts` | Created | Centralized API client with JWT, error handling, typed methods |
| `.env.local` | Updated | `NEXT_PUBLIC_API_URL` added |

## Error Handling Summary

| Status | Behavior |
|---|---|
| `200` | Parse JSON and return typed response |
| `204` | Return `undefined` (no content) |
| `401` | Sign out via Better Auth, redirect to `/login` |
| `422` | Throw `ApiError` with validation detail from backend |
| `4xx/5xx` | Throw `ApiError` with status and detail message |
| Network failure | Native `fetch` error propagates |

## Extending with New Resources

To add a new resource (e.g., Projects), follow this pattern:

1. Define the TypeScript interface in `lib/api.ts`
2. Add named functions that call `request<T>()` with the correct endpoint and method
3. Or use the generic `api.get/post/put/patch/delete` helpers for quick access

```typescript
// Add to lib/api.ts
export interface Project {
  id: string;
  name: string;
  created_at: string;
}

export const getProjects = () => request<Project[]>("/api/projects");
export const createProject = (body: { name: string }) =>
  request<Project>("/api/projects", { method: "POST", body });
```

## Validation Checklist

- [ ] `lib/api.ts` exists with `request()` wrapper and typed resource methods
- [ ] JWT is retrieved from Better Auth session and attached as `Authorization: Bearer <token>`
- [ ] 401 responses trigger sign-out and redirect to `/login`
- [ ] Non-OK responses throw structured `ApiError` with `status` and `detail`
- [ ] 204 responses return `undefined` without parsing body
- [ ] All resource methods (`getTasks`, `createTask`, etc.) are fully typed
- [ ] Generic `api` helper object exported for ad-hoc requests
- [ ] `NEXT_PUBLIC_API_URL` configured in `.env.local`
- [ ] No secrets or tokens hardcoded in source
