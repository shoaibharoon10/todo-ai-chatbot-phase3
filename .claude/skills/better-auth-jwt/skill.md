---
name: Better Auth JWT Setup
description: Configure Better Auth with JWT in frontend.
trigger: setup better auth jwt
---

# Better Auth JWT Setup Skill

## Purpose

Configure Better Auth in a Next.js frontend to issue JWTs on login, share a secret with the FastAPI backend, and automatically attach Bearer tokens to all API requests. This creates a seamless auth bridge between the Next.js UI and the FastAPI backend.

## Instructions

When triggered, execute the following steps in order:

### Step 1: Install Dependencies

```bash
npm install better-auth
```

Ensure the following environment variables are set in `.env.local`:

```env
BETTER_AUTH_SECRET=your-256-bit-secret-key
BETTER_AUTH_URL=http://localhost:3000
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname
JWT_SECRET_KEY=same-shared-secret-as-backend
```

> **Critical:** `JWT_SECRET_KEY` must be identical to the backend's `JWT_SECRET_KEY` so both services can sign and verify the same tokens.

### Step 2: Create Better Auth Server Configuration

Create `lib/auth.ts` — the server-side Better Auth instance:

```typescript
import { betterAuth } from "better-auth";
import { jwt } from "better-auth/plugins";

export const auth = betterAuth({
  database: {
    provider: "pg",
    url: process.env.DATABASE_URL!,
  },

  // Email + password authentication
  emailAndPassword: {
    enabled: true,
  },

  // JWT plugin — issues tokens using the shared secret
  plugins: [
    jwt({
      jwt: {
        issuer: "phase2-web",
        audience: "phase2-api",
        expirationTime: "30m",
      },
      jwks: {
        disabled: true, // Using symmetric secret, not JWKS
      },
      token: {
        secret: process.env.JWT_SECRET_KEY!,
        algorithm: "HS256",
        customPayload: async ({ user }) => ({
          sub: user.id,
          email: user.email,
          name: user.name,
        }),
      },
    }),
  ],

  // Session configuration
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24,      // refresh every 24 hours
  },
});

export type Session = typeof auth.$Infer.Session;
```

### Step 3: Create Auth API Route Handler

Create `app/api/auth/[...all]/route.ts`:

```typescript
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
```

### Step 4: Create Auth Client

Create `lib/auth-client.ts` — the client-side auth helper:

```typescript
import { createAuthClient } from "better-auth/react";
import { jwtClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  plugins: [jwtClient()],
});

export const {
  useSession,
  signIn,
  signUp,
  signOut,
} = authClient;
```

### Step 5: Create API Client with Bearer Token

Create `lib/api-client.ts` — attaches the JWT to every backend request:

```typescript
import { authClient } from "@/lib/auth-client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface RequestOptions extends Omit<RequestInit, "headers"> {
  headers?: Record<string, string>;
}

async function getAuthToken(): Promise<string | null> {
  try {
    const { data } = await authClient.getSession();
    if (!data) return null;

    // Retrieve the JWT from Better Auth's JWT plugin
    const { data: tokenData } = await authClient.$fetch("/api/auth/token", {
      method: "GET",
    });
    return tokenData?.token ?? null;
  } catch {
    return null;
  }
}

export async function apiClient<T = unknown>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const token = await getAuthToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Token expired or invalid — sign out and redirect
    await authClient.signOut();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new Error("Authentication expired. Please log in again.");
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      detail: "An unexpected error occurred.",
    }));
    throw new Error(error.detail || `Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

// Convenience methods
export const api = {
  get: <T = unknown>(endpoint: string) =>
    apiClient<T>(endpoint, { method: "GET" }),

  post: <T = unknown>(endpoint: string, body: unknown) =>
    apiClient<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  put: <T = unknown>(endpoint: string, body: unknown) =>
    apiClient<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  patch: <T = unknown>(endpoint: string, body: unknown) =>
    apiClient<T>(endpoint, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  delete: <T = unknown>(endpoint: string) =>
    apiClient<T>(endpoint, { method: "DELETE" }),
};
```

### Step 6: Usage in Components

#### Sign In

```typescript
"use client";

import { signIn } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();

  async function handleLogin(formData: FormData) {
    const { error } = await signIn.email({
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    });

    if (error) {
      // Handle error
      return;
    }

    router.push("/dashboard");
  }

  return (
    <form action={handleLogin}>
      <input name="email" type="email" required />
      <input name="password" type="password" required />
      <button type="submit">Sign In</button>
    </form>
  );
}
```

#### Authenticated API Call

```typescript
"use client";

import { api } from "@/lib/api-client";
import { useEffect, useState } from "react";

export function TaskList() {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    // Token is automatically attached by the API client
    api.get("/api/tasks").then(setTasks);
  }, []);

  return (
    <ul>
      {tasks.map((task) => (
        <li key={task.id}>{task.title}</li>
      ))}
    </ul>
  );
}
```

#### Protect Pages with Session Check

```typescript
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  return <div>Welcome, {session.user.name}</div>;
}
```

## File Output

| File | Action | Description |
|---|---|---|
| `lib/auth.ts` | Created | Better Auth server config with JWT plugin |
| `lib/auth-client.ts` | Created | Client-side auth helper with JWT client plugin |
| `lib/api-client.ts` | Created | API client that attaches Bearer token to requests |
| `app/api/auth/[...all]/route.ts` | Created | Catch-all auth API route |
| `.env.local` | Updated | Auth and JWT environment variables |

## Auth Flow Diagram

```
┌──────────┐     1. Login      ┌──────────────┐
│  Browser  │ ─────────────────▶ │  Next.js API │
│  (React)  │                   │ /api/auth/*  │
└─────┬─────┘                   └──────┬───────┘
      │                                │
      │  2. Session + JWT issued       │  Better Auth
      │ ◀──────────────────────────────┘  validates credentials
      │
      │  3. API request + Bearer token
      │ ─────────────────────────────────▶ ┌──────────┐
      │                                    │  FastAPI  │
      │  4. Response (user-scoped data)    │ Backend  │
      │ ◀──────────────────────────────────┤          │
      │                                    │ Verifies │
      │                                    │ JWT with │
      │                                    │ same key │
      └                                    └──────────┘
```

## Shared Secret Contract

Both services **must** use the identical secret:

| Service | Env Variable | Usage |
|---|---|---|
| Next.js (Better Auth) | `JWT_SECRET_KEY` | Signs tokens via JWT plugin |
| FastAPI (PyJWT) | `JWT_SECRET_KEY` | Verifies tokens in `get_current_user` |

Generate a strong secret:

```bash
openssl rand -base64 32
```

## Validation Checklist

- [ ] `better-auth` installed and listed in `package.json`
- [ ] `lib/auth.ts` enables the `jwt()` plugin with `HS256` and the shared secret
- [ ] `lib/auth-client.ts` includes `jwtClient()` plugin
- [ ] `app/api/auth/[...all]/route.ts` exports `GET` and `POST`
- [ ] `lib/api-client.ts` retrieves the JWT and attaches it as `Authorization: Bearer <token>`
- [ ] API client handles 401 by signing out and redirecting to `/login`
- [ ] `JWT_SECRET_KEY` is identical in frontend `.env.local` and backend `.env`
- [ ] No secrets hardcoded in source files
- [ ] Session-protected pages redirect unauthenticated users to `/login`

## Security Notes

- Use `openssl rand -base64 32` to generate the shared secret — never use weak or guessable values.
- Keep `JWT_SECRET_KEY` out of version control; only commit `.env.example` with placeholder values.
- Set token expiration to 30 minutes or less; rely on Better Auth sessions for longer-lived access.
- Always use HTTPS in production to prevent token interception.
- The API client automatically signs the user out on 401, preventing stale-token loops.
