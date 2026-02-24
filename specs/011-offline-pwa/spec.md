# Spec 011: Offline PWA

**Feature:** `011-offline-pwa`
**Phase:** 4 — Advanced Features
**Status:** Draft
**Date:** 2026-02-23
**Constitution ref:** v1.2.0 § IV (idb-keyval, next-pwa), § VIII (offline-first contract, browser-local rule)

---

## 1. Overview

Transform the app into a Progressive Web App (PWA) with offline task reading via IndexedDB. When the user is online, tasks are fetched normally and cached to IndexedDB. When offline, the cached snapshot is displayed with a banner indicating offline mode. Write operations (create, update, delete) are queued locally and synced when connectivity is restored. A web app manifest enables "Add to Home Screen" on mobile.

---

## 2. User Stories

### US1: Read tasks offline

**As a user**, I want to view my tasks even when I have no internet connection.

**Acceptance Criteria:**

| ID | Criterion |
|----|-----------|
| AC1.1 | After any successful online fetch, tasks are saved to IndexedDB via `idb-keyval` |
| AC1.2 | When offline (`navigator.onLine === false`), the cached task list is displayed |
| AC1.3 | An "Offline — showing cached data" banner is displayed when using cached data |
| AC1.4 | Cached data is keyed per `user_id` so multi-user caches don't collide |

### US2: Queue writes when offline

**As a user**, I want to create/update/delete tasks while offline and have them sync when I'm back online.

**Acceptance Criteria:**

| ID | Criterion |
|----|-----------|
| AC2.1 | Create/update/delete actions while offline are stored in an IndexedDB queue |
| AC2.2 | When connectivity is restored, the queue is flushed in order |
| AC2.3 | A toast notifies the user "Syncing X queued changes..." and "Sync complete" |
| AC2.4 | If a queued action fails on sync, an error toast is shown per-item |

### US3: Install as PWA

**As a user**, I want to install the app to my home screen for quick access.

**Acceptance Criteria:**

| ID | Criterion |
|----|-----------|
| AC3.1 | A valid `manifest.json` is served at `/manifest.json` |
| AC3.2 | Manifest includes: `name`, `short_name`, `start_url`, `display: "standalone"`, `theme_color`, `background_color`, icon |
| AC3.3 | Next.js service worker (via `next-pwa`) caches static assets for offline shell |
| AC3.4 | Lighthouse PWA score ≥ 80 (installable + basic offline) |

### US4: Offline indicator

**As a user**, I want a clear indicator in the UI when I am offline.

**Acceptance Criteria:**

| ID | Criterion |
|----|-----------|
| AC4.1 | A `useOnlineStatus` hook tracks `navigator.onLine` and `online`/`offline` events |
| AC4.2 | Header shows a small "Offline" badge (amber) when disconnected |
| AC4.3 | Badge disappears when connection is restored |

---

## 3. Out of Scope

- Background sync via Service Worker Background Sync API (complex; use foreground reconnect instead)
- Conflict resolution for concurrent edits (last-write-wins on sync)
- Offline AI chat (requires server; not feasible offline)

---

## 4. IndexedDB Schema (via idb-keyval)

`idb-keyval` is a simple key-value store. Keys used:

| Key | Value |
|-----|-------|
| `tasks:{user_id}` | `Task[]` — cached task list |
| `queue:{user_id}` | `QueuedAction[]` — pending write operations |

```typescript
interface QueuedAction {
  id: string;           // crypto.randomUUID()
  type: "create" | "update" | "delete" | "toggle";
  payload: unknown;     // matches the relevant API payload
  timestamp: number;
}
```

---

## 5. Implementation

### Cache write (after every successful API fetch)

```typescript
import { set, get } from "idb-keyval";

// In TaskList component, after getTasks() resolves:
await set(`tasks:${userId}`, tasks);
```

### Cache read (offline fallback)

```typescript
if (!navigator.onLine) {
  const cached = await get<Task[]>(`tasks:${userId}`);
  if (cached) { setTasks(cached); setIsOffline(true); }
}
```

### Write queue

```typescript
// queue-manager.ts
export async function enqueueAction(userId: string, action: QueuedAction) {
  const existing = (await get<QueuedAction[]>(`queue:${userId}`)) ?? [];
  await set(`queue:${userId}`, [...existing, action]);
}

export async function flushQueue(userId: string) {
  const queue = (await get<QueuedAction[]>(`queue:${userId}`)) ?? [];
  for (const action of queue) {
    await executeAction(action);  // calls api.ts functions
  }
  await set(`queue:${userId}`, []);
}
```

### Online status hook

```typescript
// hooks/use-online-status.ts
export function useOnlineStatus() {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);
  return online;
}
```

---

## 6. Dependencies

```bash
# Frontend
npm install idb-keyval next-pwa
```

### next-pwa config (`next.config.js`)

```javascript
const withPWA = require("next-pwa")({ dest: "public", disable: process.env.NODE_ENV === "development" });
module.exports = withPWA({ /* existing config */ });
```

---

## 7. PWA Manifest (`public/manifest.json`)

```json
{
  "name": "TaskFlow AI",
  "short_name": "TaskFlow",
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

Add `<link rel="manifest" href="/manifest.json" />` to `app/layout.tsx`.

---

## 8. Constraints

- `idb-keyval` and `next-pwa` are the only permitted libraries (per constitution § IV)
- All idb-keyval calls MUST be behind `"use client"` guards with SSR-safety checks (`typeof window !== "undefined"`)
- Cache is invalidated (overwritten) on every successful online fetch — no manual cache expiry
- Queue flush is triggered on `window` `online` event — no service worker background sync required
- Service worker is disabled in development mode (`process.env.NODE_ENV === "development"`) to avoid caching stale assets during dev
