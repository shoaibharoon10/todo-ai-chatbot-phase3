# Tasks 006: Custom Notifications

**Feature:** `006-custom-notifications`
**Plan:** `specs/006-custom-notifications/plan.md`
**Constitution ref:** v1.2.0 § IV (browser-native Notification API only), § VIII (browser-local rule — no backend changes)
**Depends on:** spec 005 tasks complete (`Task.due_date` must exist in types)
**Date:** 2026-02-23
**Total tasks:** 6

> **Note:** This feature has **zero backend changes**. All tasks are frontend-only.

---

## Phase 1 — Hook

### T001 — Create `useTaskNotifications` hook
**File:** `frontend/src/hooks/use-task-notifications.ts` *(new file)*
**Const. ref:** § IV (browser-native Notification API; no third-party push SDKs), § VIII (browser-local rule)

- [x] Create file with `"use client"` directive and `export function useTaskNotifications(tasks: Task[])`
- [x] Guard against SSR: `if (typeof Notification === "undefined") return;`
- [x] Guard against permission: `if (Notification.permission !== "granted") return;`
- [x] Store notified IDs in `useRef<Set<number>>(new Set())` to prevent duplicate notifications
- [x] `useEffect` that:
  - Defines `check()` function iterating over `tasks`
  - Skips completed tasks (`task.completed`) and tasks without `due_date`
  - Skips already-notified task IDs (`notifiedIds.current.has(task.id)`)
  - Fires when `due_date - now <= 60 * 60 * 1000` (due within 1 hour or overdue)
  - Adds `task.id` to `notifiedIds.current` before firing
  - Creates `new Notification(task.title, { body })` where body = "Overdue since HH:MM" or "Due at HH:MM" using `Intl.DateTimeFormat(undefined, { timeStyle: "short" })`
  - Sets `n.onclick = () => { window.focus(); n.close(); }`
  - Calls `check()` immediately, then `setInterval(check, 60_000)`
  - Returns cleanup: `clearInterval(id)`
- [x] Hook depends on `tasks` array (listed in `useEffect` deps)
- [x] Verify: TypeScript 0 errors

---

## Phase 2 — Permission Component

### T002 — Create `NotificationPermissionButton` component
**File:** `frontend/src/components/features/tasks/notification-permission-button.tsx` *(new file)*
**Const. ref:** § IV (no third-party notification SDK), § VI (graceful error handling with user feedback)

- [x] `"use client"` directive
- [x] Return `null` if `typeof Notification === "undefined"` (SSR guard via useEffect + null state)
- [x] `useState<NotificationPermission>` initialized from `Notification.permission`
- [x] `async function request()`:
  - Call `Notification.requestPermission()` → store result in state
  - If `"granted"` → `toast.success("Task reminders enabled")`
  - If `"denied"` → `toast.error("Reminders blocked — enable notifications in browser settings")`
- [x] Render:
  - If `permission === "granted"`: disabled Button variant="outline" size="sm" with `<Bell>` green icon + "Reminders On"
  - Otherwise: Button with `<BellOff>` icon + "Enable Reminders" text, `onClick={request}`
- [x] Import `Bell`, `BellOff` from `lucide-react`
- [x] Verify: button hidden in SSR; permission state reflects actual browser permission

---

## Phase 3 — Integration

### T003 — Wire `useTaskNotifications` into `TaskList`
**File:** `frontend/src/components/features/tasks/task-list.tsx`
**Const. ref:** § VIII (browser-local — no API calls for notification logic)

- [x] Import `useTaskNotifications` from `@/hooks/use-task-notifications`
- [x] Import `Task` type from `@/types`
- [x] Locate where `tasks` state array is held in `TaskList`
- [x] Add hook call: `useTaskNotifications(tasks)` (passive — no JSX output)
- [x] Verify: hook is called after tasks are loaded; no React errors in console

### T004 — Add `NotificationPermissionButton` to tasks page header area
**File:** `frontend/src/app/(protected)/tasks/page.tsx`
**Const. ref:** § VI (user-visible feature controls accessible on main task page)

- [x] Import `NotificationPermissionButton`
- [x] Place button in the header row above `<TaskList />` (right-aligned alongside any existing controls)
- [x] Verify: button renders on `/tasks` page; SSR produces no hydration error
- [x] If hydration warning appears: add `suppressHydrationWarning` to the button's wrapper element

---

## Phase 4 — Testing

### T005 — SSR and API guard verification
**Const. ref:** § IV ("use client" only for interactivity / browser APIs)

- [x] Open `/tasks` in browser — no console errors
- [x] Check: `NotificationPermissionButton` only renders client-side (no server HTML for it)
- [x] Check: `useTaskNotifications` does not throw when `Notification` is undefined (Node SSR simulation)

### T006 — End-to-end notification verification
**Const. ref:** § VI (all errors handled gracefully; user-visible feedback)

| Check | Expected |
|-------|----------|
| Permission = "default" | "Enable Reminders" button shown |
| Click button | Browser permission prompt appears |
| Grant permission | "Reminders On" button (disabled); success toast |
| Deny permission | Error toast with browser settings hint |
| Task with `due_date` 30 min from now + granted | Notification fires within 60 s |
| Same task on next poll | No duplicate notification |
| Completed task with past `due_date` | No notification |
| `null` `due_date` task | No notification |
| DevTools → block Notification API | Button hidden (SSR guard works) |
