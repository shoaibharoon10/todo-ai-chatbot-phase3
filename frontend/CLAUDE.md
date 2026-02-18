# Frontend Development Guidelines

## Stack

- **Framework**: Next.js 16+ (App Router), React 19, TypeScript 5
- **Styling**: Tailwind CSS 4 + shadcn/ui components
- **Auth**: Better Auth client (`@/lib/auth-client.ts`) with JWT plugin (HS256)
- **API Client**: Centralized at `@/lib/api.ts` with automatic Bearer token attachment

## Component Rules

- **Server Components by default**. Only add `"use client"` when the component
  needs interactivity, browser APIs, or React hooks.
- **Client Components**: auth forms, task interactions, chat input/message list,
  theme toggle, dropdowns, dialogs.
- All styling via Tailwind CSS utility classes. No CSS-in-JS, no inline styles.
- UI primitives from `@/components/ui/` (shadcn). Feature components in
  `@/components/features/`.

## Project Structure

```
src/
  app/
    (auth)/          # Login, signup pages
    (protected)/     # Authenticated pages (tasks, chat)
    api/auth/        # Better Auth API routes + JWT token endpoint
    layout.tsx       # Root layout
    page.tsx         # Landing / redirect
  components/
    features/
      auth/          # Login/signup forms
      layout/        # Header, nav, user menu
      tasks/         # Task CRUD components
      chat/          # Chat UI components (Phase 3)
    ui/              # shadcn primitives
  lib/
    api.ts           # Centralized API client (tasks + chat)
    auth.ts          # Server-side auth utilities
    auth-client.ts   # Better Auth client instance
    utils.ts         # Helpers (cn, etc.)
    validations.ts   # Zod schemas
    types/index.ts   # TypeScript type definitions
```

## API Client Pattern

All backend calls go through `@/lib/api.ts`. The `request()` function:
1. Fetches JWT from `/api/auth/token`
2. Attaches `Authorization: Bearer <token>` header
3. Handles 401 by signing out and redirecting to `/login`
4. Returns typed JSON responses

## Phase 3: Chat UI

- Custom React component (`"use client"`) for the AI chatbot.
- Located at `@/components/features/chat/`.
- Sends messages to `POST /api/{user_id}/chat` via the API client.
- Renders message history (user, assistant, tool results).
- No third-party chat UI kits (no ChatKit, no OpenAI widgets).
- Must be responsive (mobile-first Tailwind).

## Environment Variables

See `frontend/.env.example` for required variables.

## Running

```bash
npm install
npm run dev    # http://localhost:3000
```
