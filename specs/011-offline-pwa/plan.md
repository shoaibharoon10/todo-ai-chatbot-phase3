# Plan 011: Offline PWA

**Feature:** `011-offline-pwa`
**Spec:** `specs/011-offline-pwa/spec.md`
**Constitution ref:** v1.2.0 § IV (idb-keyval + next-pwa), § VIII (offline-first contract, write-queue flush on reconnect)
**Status:** Draft
**Date:** 2026-02-23

---

## Architectural Overview

Two capabilities are delivered:

1. **Offline read cache** — after every successful online fetch, tasks are saved to IndexedDB via `idb-keyval`. When offline, the cached snapshot is shown with an "Offline" banner.
2. **Write queue** — create/update/delete actions while offline are queued in IndexedDB and flushed when the `online` event fires.
3. **PWA shell** — `next-pwa` generates a service worker that caches static assets; a `manifest.json` enables "Add to Home Screen".

### Key decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| IndexedDB wrapper | `idb-keyval` | Constitution § IV lockdown; simple key-value API |
| Service worker | `next-pwa` | Constitution § IV; plugs into Next.js config cleanly |
| SW disabled in dev | `disable: process.env.NODE_ENV === "development"` | Avoids stale cache during development |
| Write flush trigger | `window online` event (foreground) | Simpler than SW Background Sync; sufficient for hackathon |
| Conflict resolution | Last-write-wins on flush | Simplest; documented in spec |

---

## Phases

### Phase 1 — Dependencies

```bash
cd frontend && npm install idb-keyval next-pwa
```

**Update `frontend/next.config.js`:**
```javascript
const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
});
module.exports = withPWA({ /* existing config */ });
```

**Acceptance checks:**
- [ ] `idb-keyval` and `next-pwa` in `package.json`
- [ ] Build succeeds; SW generated in production mode

---

### Phase 2 — PWA Manifest + Icons

**New files:**
- `frontend/public/manifest.json`

```json
{
  "name": "TaskFlow AI",
  "short_name": "TaskFlow",
  "description": "AI-powered task management",
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

- `frontend/public/icon-192.png` — 192×192 app icon (simple indigo square with "TF" text; generate via any icon tool or use a placeholder)
- `frontend/public/icon-512.png` — 512×512 version

**Update `frontend/src/app/layout.tsx`:**
```tsx
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#4f46e5" />
```

**Acceptance checks:**
- [ ] `/manifest.json` serves 200 with correct content-type
- [ ] Chrome DevTools > Application > Manifest shows no errors
- [ ] "Add to Home Screen" prompt appears on mobile Chrome

---

### Phase 3 — Online Status Hook

**New file:** `frontend/src/hooks/use-online-status.ts`

```typescript
"use client";
import { useEffect, useState } from "react";

export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);
  return online;
}
```

**Acceptance checks:**
- [ ] Hook returns `true` when online, `false` when offline (DevTools > Network > Offline)
- [ ] No SSR crash (navigator guard)

---

### Phase 4 — Offline Indicator in Header

**Goal:** Show amber "Offline" badge in header when disconnected.

**Files to modify:**
- `frontend/src/components/features/layout/header.tsx` — import `useOnlineStatus`; render badge conditionally

```tsx
const online = useOnlineStatus();
// In header JSX:
{!online && (
  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900 dark:text-amber-300">
    Offline
  </span>
)}
```

**Acceptance checks:**
- [ ] Badge appears when network disabled
- [ ] Badge disappears on reconnect
- [ ] Header converts to `"use client"` if not already

---

### Phase 5 — Task Cache (idb-keyval)

**Goal:** Cache tasks to IndexedDB after every successful fetch; serve cache when offline.

**New file:** `frontend/src/lib/task-cache.ts`

```typescript
import { get, set } from "idb-keyval";
import type { Task } from "@/types";

const cacheKey = (userId: string) => `tasks:${userId}`;

export async function cacheTasksForUser(userId: string, tasks: Task[]): Promise<void> {
  await set(cacheKey(userId), tasks);
}

export async function getCachedTasksForUser(userId: string): Promise<Task[] | undefined> {
  return get<Task[]>(cacheKey(userId));
}
```

**Files to modify:**
- `frontend/src/components/features/tasks/task-list.tsx`

```typescript
// After successful getTasks() call:
await cacheTasksForUser(userId, fetchedTasks);

// On fetch failure AND navigator.onLine === false:
const cached = await getCachedTasksForUser(userId);
if (cached) { setTasks(cached); setIsOffline(true); }
```

**Add offline banner JSX in `TaskList`:**
```tsx
{isOffline && (
  <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
    Offline — showing cached data
  </div>
)}
```

**Acceptance checks:**
- [ ] Tasks visible after DevTools Network → Offline (if previously loaded)
- [ ] "Offline — showing cached data" banner shown
- [ ] Banner hidden when online

---

### Phase 6 — Write Queue

**Goal:** Queue create/update/delete actions when offline; flush on reconnect.

**New file:** `frontend/src/lib/action-queue.ts`

```typescript
import { get, set } from "idb-keyval";

export interface QueuedAction {
  id: string;
  type: "create" | "update" | "delete" | "toggle";
  payload: unknown;
  timestamp: number;
}

const queueKey = (userId: string) => `queue:${userId}`;

export async function enqueue(userId: string, action: Omit<QueuedAction, "id" | "timestamp">) {
  const existing = (await get<QueuedAction[]>(queueKey(userId))) ?? [];
  await set(queueKey(userId), [
    ...existing,
    { ...action, id: crypto.randomUUID(), timestamp: Date.now() },
  ]);
}

export async function flushQueue(userId: string, executor: (a: QueuedAction) => Promise<void>) {
  const queue = (await get<QueuedAction[]>(queueKey(userId))) ?? [];
  if (!queue.length) return;
  const failed: QueuedAction[] = [];
  for (const action of queue) {
    try { await executor(action); }
    catch { failed.push(action); }
  }
  await set(queueKey(userId), failed);
  return { attempted: queue.length, failed: failed.length };
}
```

**Wire into `TaskList`:**
```typescript
// On window "online" event (via useOnlineStatus transition):
useEffect(() => {
  if (online && userId) {
    flushQueue(userId, executeQueuedAction).then((result) => {
      if (result?.attempted) {
        toast.success(`Synced ${result.attempted - result.failed} changes`);
        if (result.failed) toast.error(`${result.failed} changes failed to sync`);
        refetchTasks();
      }
    });
  }
}, [online]);
```

**Acceptance checks:**
- [ ] Creating task while offline stores action in IndexedDB queue
- [ ] On reconnect, queued action executed; task appears in list
- [ ] "Syncing" toast shown; "Sync complete" or error toast follows
- [ ] TypeScript: 0 errors

---

### Phase 7 — Testing

| Test | Expected |
|------|----------|
| Go offline → load `/tasks` | Cached tasks shown; offline banner visible |
| Go offline → create task | Queued in IndexedDB; toast "saved offline" |
| Go online | Queue flushed; sync toast; task appears |
| `/manifest.json` | Valid JSON, 200 response |
| Lighthouse PWA audit | Installable; basic offline shell; score ≥ 80 |
| Header offline badge | Shows/hides with network toggle |
| TypeScript diagnostics | 0 errors |

---

## Risks & Mitigations

| Risk | Blast radius | Mitigation |
|------|-------------|------------|
| `idb-keyval` SSR crash | Build failure | All imports behind `"use client"` + `typeof window` guards |
| `next-pwa` intercepts API calls (bad SW strategy) | API calls fail offline | Configure `runtimeCaching` to network-first for `/api/*` routes |
| Stale cache after schema change | Wrong task shape | Cache is overwritten on every online fetch; no cache versioning needed |
| Icon files missing | PWA not installable | Add placeholder 192/512 PNG; Lighthouse accepts any valid icon |

📋 **Architectural decision detected:** IndexedDB as a client-side write buffer creates a second source of truth for task data alongside PostgreSQL. Queue flush order, conflict resolution (last-write-wins), and failure modes need documented policy. Document? Run `/sp.adr offline-data-sync-strategy`
