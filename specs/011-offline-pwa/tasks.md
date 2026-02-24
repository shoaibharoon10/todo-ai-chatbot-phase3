# Tasks 011: Offline PWA

**Feature:** `011-offline-pwa`
**Plan:** `specs/011-offline-pwa/plan.md`
**Constitution ref:** v1.2.0 § IV (idb-keyval + next-pwa locked), § VIII (offline-first: cache reads; write queue; flush on reconnect)
**Date:** 2026-02-23
**Total tasks:** 12

> **Note:** This feature has **zero backend changes**. All tasks are frontend-only.

---

## Phase 1 — Dependencies & Config

### T001 — Install `idb-keyval` and `next-pwa`
**Const. ref:** § IV (idb-keyval and next-pwa are locked Phase 4 additions)

- [x] `cd frontend && npm install idb-keyval next-pwa`
- [x] Verify both appear in `frontend/package.json` dependencies
- [x] Verify: `from "idb-keyval"` resolves without TypeScript errors

### T002 — Configure `next-pwa` in `next.config.js`
**File:** `frontend/next.config.js` (or `next.config.ts`)

- [x] Wrap existing config with `withPWA`:
  ```javascript
  const withPWA = require("next-pwa")({
    dest: "public",
    disable: process.env.NODE_ENV === "development",
    register: true,
    skipWaiting: true,
    runtimeCaching: [
      {
        urlPattern: /^\/api\//,
        handler: "NetworkFirst",
        options: { cacheName: "api-cache", networkTimeoutSeconds: 5 },
      },
    ],
  });
  module.exports = withPWA({ /* existing exports */ });
  ```
- [x] `disable: process.env.NODE_ENV === "development"` — prevents stale cache in dev
- [x] `NetworkFirst` for `/api/*` — tries network, falls back to cache (avoids stale API responses)
- [x] Verify: build in production mode generates `sw.js` and `workbox-*.js` in `public/`

---

## Phase 2 — PWA Manifest & Icons

### T003 — Create `manifest.json` and app icons
**File:** `frontend/public/manifest.json` *(new file)*
**Const. ref:** § VIII (PWA installable; Lighthouse score ≥ 80)

- [x] Create `public/manifest.json`:
  ```json
  {
    "name": "TaskFlow AI",
    "short_name": "TaskFlow",
    "description": "AI-powered personal task manager",
    "start_url": "/tasks",
    "display": "standalone",
    "theme_color": "#4f46e5",
    "background_color": "#ffffff",
    "icons": [
      { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
      { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
    ]
  }
  ```
- [x] Create `public/icon-192.png` — 192×192 PNG (indigo square with "TF" white text; generate with any tool or use a placeholder image)
- [x] Create `public/icon-512.png` — 512×512 PNG (same design, larger)
- [x] Verify: `GET /manifest.json` returns 200 with `Content-Type: application/manifest+json`

### T004 — Link manifest in `app/layout.tsx`
**File:** `frontend/src/app/layout.tsx`

- [x] Add in `<head>` section:
  ```tsx
  <link rel="manifest" href="/manifest.json" />
  <meta name="theme-color" content="#4f46e5" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  ```
- [x] Verify: Chrome DevTools → Application → Manifest shows no errors

---

## Phase 3 — Online Status

### T005 — Create `useOnlineStatus` hook
**File:** `frontend/src/hooks/use-online-status.ts` *(new file)*
**Const. ref:** § VIII (offline-first — browser `online`/`offline` events drive sync)

- [x] Export `useOnlineStatus(): boolean`
- [x] Initialize from `typeof navigator !== "undefined" ? navigator.onLine : true`
- [x] `useEffect`: add `window.addEventListener("online", ...)` and `"offline"` listeners; return cleanup
- [x] Verify: returns `false` when DevTools → Network → Offline; `true` on reconnect

### T006 — Add offline indicator badge to header
**File:** `frontend/src/components/features/layout/header.tsx`
**Const. ref:** § VIII (offline indicator visible to user)

- [x] Import `useOnlineStatus` (ensure header is `"use client"` or extract to child component)
- [x] Render amber pill badge when `!online`:
  ```tsx
  {!online && (
    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900 dark:text-amber-300">
      Offline
    </span>
  )}
  ```
- [x] Verify: badge appears when network disabled; disappears on reconnect
- [x] If header is Server Component: extract online indicator to a separate `"use client"` `OfflineBadge` component and import it

---

## Phase 4 — Task Cache

### T007 — Create `task-cache.ts` utility
**File:** `frontend/src/lib/task-cache.ts` *(new file)*
**Const. ref:** § VIII (offline-first: cache tasks after every successful fetch; idb-keyval keyed by user_id)

- [x] Add:
  ```typescript
  import { get, set } from "idb-keyval";
  import type { Task } from "@/types";

  export const cacheTasksForUser = (userId: string, tasks: Task[]) =>
    set(`tasks:${userId}`, tasks);

  export const getCachedTasksForUser = (userId: string) =>
    get<Task[]>(`tasks:${userId}`);
  ```
- [x] Ensure all calls are inside `"use client"` components (idb-keyval uses IndexedDB — browser only)
- [x] Verify: TypeScript 0 errors

### T008 — Wire cache into `TaskList`
**File:** `frontend/src/components/features/tasks/task-list.tsx`
**Const. ref:** § VIII (after successful fetch → cache; on failure + offline → serve cache)

- [x] Import `cacheTasksForUser`, `getCachedTasksForUser`, `useOnlineStatus`
- [x] Add `isOffline: boolean` state
- [x] After successful `getTasks()` call: `await cacheTasksForUser(userId, fetchedTasks)`
- [x] In catch block (API error): if `!navigator.onLine`, load from cache:
  ```typescript
  const cached = await getCachedTasksForUser(userId);
  if (cached) { setTasks(cached); setIsOffline(true); }
  ```
- [x] Add offline banner in JSX above task list:
  ```tsx
  {isOffline && (
    <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
      Offline — showing cached data
    </div>
  )}
  ```
- [x] Clear `isOffline` when network restores and refetch succeeds
- [x] Verify: task list shows cached data with banner when offline

---

## Phase 5 — Write Queue

### T009 — Create `action-queue.ts` utility
**File:** `frontend/src/lib/action-queue.ts` *(new file)*
**Const. ref:** § VIII (writes queued in IndexedDB; flushed on reconnect; last-write-wins)

- [x] Add `QueuedAction` interface:
  ```typescript
  export interface QueuedAction {
    id: string;
    type: "create" | "update" | "delete" | "toggle";
    payload: unknown;
    timestamp: number;
  }
  ```
- [x] Add `enqueueAction(userId, action)` — appends to `queue:{userId}` in idb-keyval
- [x] Add `flushQueue(userId, executor)` — processes each queued action in order; keeps failed items; returns `{ attempted, failed }` counts
- [x] Verify: TypeScript 0 errors

### T010 — Wire write queue into `TaskList`
**File:** `frontend/src/components/features/tasks/task-list.tsx`
**Const. ref:** § VIII (flush on reconnect; toast confirmation)

- [x] Import `enqueueAction`, `flushQueue` from `@/lib/action-queue`
- [x] When `!navigator.onLine` and user creates/updates/deletes task:
  - Instead of calling API: call `enqueueAction(userId, { type: "create", payload: taskData })`
  - Show toast: "Saved offline — will sync when connected"
- [x] `useEffect` on `online` status change → `true`:
  ```typescript
  if (online && userId) {
    const result = await flushQueue(userId, executeQueuedAction);
    if (result?.attempted) {
      toast.success(`Synced ${result.attempted - result.failed} changes`);
      if (result.failed) toast.error(`${result.failed} changes failed to sync`);
      refetchTasks();
    }
  }
  ```
- [x] Implement `executeQueuedAction(action: QueuedAction)` mapping `type` to API calls
- [x] Verify: create task offline → appears in queue; reconnect → action executed; task appears

---

## Phase 6 — ADR Task

### T011 — Document offline data sync strategy
**Const. ref:** v1.2.0 § VIII; plan.md ADR suggestion

- [x] Run `/sp.adr offline-data-sync-strategy` to document:
  - IndexedDB as second source of truth alongside PostgreSQL
  - Queue flush strategy (order: sequential, oldest-first)
  - Conflict resolution: last-write-wins on flush
  - Failure mode: failed items remain in queue; user notified per item
  - Out-of-scope: background sync, CRDT merging

---

## Phase 7 — End-to-End Testing

### T012 — Verify PWA and offline behaviour
**Const. ref:** § VIII (offline-first contract; PWA installable)

| Check | Expected |
|-------|----------|
| DevTools → Offline → load `/tasks` | Cached tasks shown; offline banner visible |
| DevTools → Offline → create task | Queued in IndexedDB; "Saved offline" toast |
| DevTools → go Online | Queue flushed; "Synced X changes" toast; task appears |
| `/manifest.json` | 200 response; valid JSON |
| DevTools → Application → Manifest | No errors; all fields present |
| DevTools → Application → Service Workers | SW registered (production build) |
| Header offline badge | Amber pill appears/disappears with network toggle |
| Lighthouse PWA audit | Score ≥ 80; installable; basic offline |
| TypeScript diagnostics | 0 errors |
