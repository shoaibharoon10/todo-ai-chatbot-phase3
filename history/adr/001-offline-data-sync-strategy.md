# ADR-001: Offline Data Sync Strategy

- **Status:** Accepted
- **Date:** 2026-02-23
- **Feature:** `011-offline-pwa`
- **Context:** TaskFlow requires offline read and write capability. The backend (FastAPI + Neon PostgreSQL) is the authoritative source of truth, but browser clients need to function without network access. This creates a dual-source-of-truth situation: the server DB and the browser's IndexedDB. The system must define clear semantics for how data is read offline, how writes are queued, how the queue is flushed on reconnect, and what happens when conflicts arise. The constitution (v1.2.0 § IV) locks the implementation to `idb-keyval` and `next-pwa`; no alternative persistence libraries are permitted.

## Decision

A three-part offline data strategy using IndexedDB (via `idb-keyval`) as the client-side persistence layer:

- **Read cache**: After every successful `GET /api/{user_id}/tasks` response, the full task list is written to IndexedDB under key `tasks:{user_id}`. When the app detects `navigator.onLine === false` and the API fetch fails, the cached snapshot is loaded and an "Offline — showing cached data" banner is displayed. Cache is invalidated (overwritten) on every successful online fetch; no manual expiry logic.
- **Write queue**: When a create/update/delete/toggle action is triggered while offline, a `QueuedAction` object (with `id: crypto.randomUUID()`, `type`, `payload`, `timestamp`) is appended to an ordered array at IndexedDB key `queue:{user_id}`. Offline CRUD actions are not applied optimistically to the local cache — the UI shows the pending state via toast.
- **Foreground flush on reconnect**: The `window` `online` event (tracked via a `useOnlineStatus` hook) triggers `flushQueue()`. The queue is processed in insertion order (FIFO). Each action calls the appropriate `api.ts` function. Failed actions are retained in the queue; succeeded actions are removed. After flush, `getTasks()` is re-called to refresh the server-authoritative snapshot.
- **Last-write-wins conflict resolution**: No merge logic is applied. Whichever write reaches the server last wins. This is explicitly accepted for hackathon scope; the policy is documented here so future engineers understand the intent rather than discovering it by accident.
- **Per-user key isolation**: Both cache and queue keys include `user_id` suffix (`tasks:{user_id}`, `queue:{user_id}`) to prevent multi-user collisions on shared devices.
- **PWA Shell (co-decision)**: `next-pwa` generates a service worker that caches static assets. Service worker is disabled in development (`disable: process.env.NODE_ENV === "development"`). API routes (`/api/*`) use network-first strategy to avoid SW caching stale server responses. A `public/manifest.json` enables "Add to Home Screen" on mobile.

## Consequences

### Positive

- Simple implementation: `idb-keyval` key-value API requires no schema setup or migrations
- Queue is durable across page reloads (IndexedDB persists until cleared)
- Per-user cache key isolation is trivially correct and collision-free
- Foreground flush is fully observable: engineers can add breakpoints, toasts, and logs without SW debugging complexity
- No additional backend changes required — flush reuses existing REST endpoints
- SSR safety is straightforward: all `idb-keyval` calls are in `"use client"` components with `typeof window` guards
- next-pwa provides Lighthouse-auditable PWA installability with minimal config

### Negative

- **Last-write-wins can cause data loss**: If a task is edited on two devices while both are offline, only the last flush to reach the server survives. Rare for single-user task management; accepted.
- **No optimistic local update for queued writes**: The task list may appear stale (not reflecting queued creates/edits) until the queue flushes. Engineers must not assume the read cache reflects pending writes.
- **Cache becomes stale if the server schema changes**: Adding a new column will make the cached `Task[]` objects outdated until the next online fetch. Mitigated: cache is always overwritten on next successful fetch.
- **Queue grows unbounded if never flushed**: If a user queues many offline actions and never goes online, IndexedDB entry grows. No size limit enforced; acceptable for hackathon scope.
- **No background sync**: If the user closes the browser while offline with pending actions, the queue is not flushed until they reopen the app and reconnect. The SW Background Sync API was explicitly excluded (see Alternatives).

## Alternatives Considered

### Alternative A: Service Worker Background Sync API
- SW Background Sync allows queued actions to be flushed even when the page is closed (browser holds the queue)
- **Rejected**: Significantly higher implementation complexity (SW registration, background fetch permissions, cross-browser compatibility gaps on iOS Safari). Constitution § VIII explicitly permits foreground-only reconnect for hackathon scope.

### Alternative B: Optimistic Local State Only (no IndexedDB persistence)
- Store pending actions in React state; discard on page reload; never cache reads
- **Rejected**: Violates offline-first contract (US1). If user refreshes while offline, all task data is lost. Unacceptable UX.

### Alternative C: Conflict-Free Replicated Data Types (CRDTs)
- Use a CRDT library (e.g., `automerge`, `yjs`) to merge concurrent offline edits without last-write-wins loss
- **Rejected**: Requires backend changes (CRDT merge on server), a CRDT library (~200KB), and significant complexity. Disproportionate for a single-user task app. Constitution § IV prohibits unlisted libraries.

### Alternative D: Manual Merge UI
- Show a conflict resolution dialog when the queue flush detects a 409 Conflict response from the server
- **Rejected**: No conflict detection is implemented on the backend (no versioning/ETag). Would require backend changes and a complex UI flow. Last-write-wins is sufficient.

## References

- Feature Spec: `specs/011-offline-pwa/spec.md`
- Implementation Plan: `specs/011-offline-pwa/plan.md`
- Related ADRs: none (first ADR in this project)
- Constitution: `.specify/memory/constitution.md` v1.2.0 § IV (library lockdown), § VIII (offline-first contract)
