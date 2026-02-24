# Plan 006: Custom Notifications

**Feature:** `006-custom-notifications`
**Spec:** `specs/006-custom-notifications/spec.md`
**Constitution ref:** v1.2.0 § IV (browser-native Notification API only), § VIII (browser-local rule)
**Depends on:** spec 005 (`due_date` field must exist on `Task`)
**Status:** Draft
**Date:** 2026-02-23

---

## Architectural Overview

This is a **purely frontend feature** — zero backend changes. All logic lives in two new client-side modules:

1. `useTaskNotifications(tasks)` hook — polls every 60 s, fires `Notification` for due/overdue tasks
2. `NotificationPermissionButton` component — requests permission, shows current state

The hook is mounted inside `TaskList` (or its parent page) so it has access to the live task array. Deduplication is session-scoped via an in-memory `Set` stored in a `useRef` — no persistence across page reloads.

### Key decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Notification mechanism | Browser Notification API | Constitution § IV — no third-party SDKs |
| Persistence of "notified" set | `useRef` (in-memory) | Session-scoped; no DB/storage overhead |
| Polling vs. Service Worker Background Sync | Polling (foreground) | Simpler; SW Background Sync has complex error handling out of scope |
| Permission UX | Button in tasks page header area | Visible but non-intrusive; no modal nag |

---

## Phases

### Phase 1 — Hook: `useTaskNotifications`

**Goal:** Create the core notification logic as a reusable hook.

**New file:** `frontend/src/hooks/use-task-notifications.ts`

```typescript
"use client";
import { useEffect, useRef } from "react";
import type { Task } from "@/types";

export function useTaskNotifications(tasks: Task[]) {
  const notifiedIds = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (typeof Notification === "undefined") return;
    if (Notification.permission !== "granted") return;

    const check = () => {
      const now = Date.now();
      tasks.forEach((task) => {
        if (task.completed || !task.due_date) return;
        if (notifiedIds.current.has(task.id)) return;
        const dueMs = new Date(task.due_date).getTime();
        const diffMs = dueMs - now;
        // Fire if due within 1 hour OR already overdue
        if (diffMs <= 60 * 60 * 1000) {
          notifiedIds.current.add(task.id);
          const fmt = new Intl.DateTimeFormat(undefined, { timeStyle: "short" });
          const body = diffMs < 0
            ? `Overdue since ${fmt.format(dueMs)}`
            : `Due at ${fmt.format(dueMs)}`;
          const n = new Notification(task.title, { body });
          n.onclick = () => { window.focus(); n.close(); };
        }
      });
    };

    check();
    const id = setInterval(check, 60_000);
    return () => clearInterval(id);
  }, [tasks]);
}
```

**Acceptance checks:**
- [ ] Hook fires no notifications when `Notification.permission !== "granted"`
- [ ] Each task ID fires at most once per session
- [ ] Overdue tasks show "Overdue since HH:MM" body
- [ ] Due-soon tasks (within 1 hour) show "Due at HH:MM" body

---

### Phase 2 — Component: `NotificationPermissionButton`

**Goal:** Create a UI control to request and display permission state.

**New file:** `frontend/src/components/features/tasks/notification-permission-button.tsx`

```typescript
"use client";
import { useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function NotificationPermissionButton() {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );

  if (typeof Notification === "undefined") return null; // SSR guard

  async function request() {
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === "granted") toast.success("Task reminders enabled");
    else if (result === "denied") toast.error("Reminders blocked — enable in browser settings");
  }

  if (permission === "granted") {
    return (
      <Button variant="outline" size="sm" disabled>
        <Bell className="mr-1.5 h-4 w-4 text-green-600" /> Reminders On
      </Button>
    );
  }
  return (
    <Button variant="outline" size="sm" onClick={request}>
      <BellOff className="mr-1.5 h-4 w-4" /> Enable Reminders
    </Button>
  );
}
```

**Acceptance checks:**
- [ ] Button not rendered during SSR (guarded by `typeof Notification === "undefined"`)
- [ ] "granted" state shows disabled "Reminders On" button with green icon
- [ ] "denied" state shows error toast explaining browser settings
- [ ] `suppressHydrationWarning` added if hydration mismatch appears (Notification API is client-only)

---

### Phase 3 — Integration into TasksPage / TaskList

**Goal:** Wire hook and button into the existing tasks UI.

**Files to modify:**
- `frontend/src/app/(protected)/tasks/page.tsx` — import and call `useTaskNotifications(tasks)`; add `<NotificationPermissionButton />`

Since `tasks/page.tsx` is already `"use client"` (converted in Feature 004), it can directly use hooks.

**Wire-up pattern:**
```tsx
// tasks/page.tsx
const [tasks, setTasks] = useState<Task[]>([]);
useTaskNotifications(tasks);  // passive hook, no JSX

// In the header row above TaskList:
<NotificationPermissionButton />
```

The `tasks` state is lifted from `TaskList` to `TasksPage` to share with the hook, OR the hook is placed inside `TaskList` which already holds the task array. The simpler approach (no prop drilling): move hook to `TaskList` directly.

**Preferred placement:** `TaskList` component — it already manages the task array state.

**Files to modify:**
- `frontend/src/components/features/tasks/task-list.tsx` — add `useTaskNotifications(tasks)` call

**Acceptance checks:**
- [ ] Hook is called; no React error
- [ ] `NotificationPermissionButton` appears in tasks page header area
- [ ] TypeScript: 0 errors

---

### Phase 4 — Testing

| Test | Expected |
|------|----------|
| Page load with permission="default" | "Enable Reminders" button shown |
| Click "Enable Reminders" | Browser permission prompt appears |
| Grant permission | "Reminders On" button; success toast |
| Deny permission | Error toast with browser settings hint |
| Task with due_date 30 min from now | Notification fires within 60 s of hook mount |
| Task already notified | No duplicate notification on next poll cycle |
| SSR (no window) | No crash, button hidden |

---

## Risks & Mitigations

| Risk | Blast radius | Mitigation |
|------|-------------|------------|
| Notification API unsupported (Safari < 16.4, HTTP) | Silent failure | `typeof Notification === "undefined"` guard; button hidden |
| User denies permission then changes mind | Reminders never fire | Toast explains "enable in browser Settings → Notifications" |
| Hook unmounts/remounts (navigation) | Duplicate notifications | Session-scoped `notifiedIds` ref resets on new mount — acceptable |
