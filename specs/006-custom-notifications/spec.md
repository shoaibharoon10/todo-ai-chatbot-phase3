# Spec 006: Custom Notifications

**Feature:** `006-custom-notifications`
**Phase:** 4 — Advanced Features
**Status:** Draft
**Date:** 2026-02-23
**Constitution ref:** v1.2.0 § IV (browser-native Notification API), § VIII (browser-local rule)
**Depends on:** spec 005 (due_date field on tasks)

---

## 1. Overview

Deliver browser-native notifications to remind users of upcoming and overdue tasks. All notification logic runs client-side (no server push infrastructure). Users grant permission once; a background polling loop checks for due tasks every minute and fires notifications.

---

## 2. User Stories

### US1: Grant notification permission

**As a user**, I want to opt in to task reminders so I don't miss due dates.

**Acceptance Criteria:**

| ID | Criterion |
|----|-----------|
| AC1.1 | A "Enable Reminders" button appears on the /tasks page (or settings area) |
| AC1.2 | Clicking it calls `Notification.requestPermission()` |
| AC1.3 | If permission is granted, a success toast is shown |
| AC1.4 | If permission is denied, an informative toast explains browser settings |
| AC1.5 | The button state reflects current permission: "Reminders On" / "Enable Reminders" |

### US2: Receive reminder notifications

**As a user**, I want to receive a browser notification when a task is due soon or overdue.

**Acceptance Criteria:**

| ID | Criterion |
|----|-----------|
| AC2.1 | A polling loop runs every 60 seconds while the /tasks page is mounted |
| AC2.2 | Tasks due within 60 minutes trigger a "Due soon" notification |
| AC2.3 | Overdue tasks (due_date < now, not completed) trigger an "Overdue" notification |
| AC2.4 | Each task fires at most one notification per browser session (deduplication via in-memory Set) |
| AC2.5 | Notification title: task title; body: "Due at <time>" or "Overdue since <time>" |
| AC2.6 | Notifications are NOT shown if permission is not granted |

### US3: Dismiss / snooze

**As a user**, I want clicking a notification to focus the app tab.

**Acceptance Criteria:**

| ID | Criterion |
|----|-----------|
| AC3.1 | Clicking the notification calls `window.focus()` and closes the notification |
| AC3.2 | No server-side snooze state — snooze is out of scope for this feature |

---

## 3. Out of Scope

- Server-sent push notifications (Web Push / VAPID)
- Notification preferences stored in the database
- Email reminders
- Notification history / notification centre UI

---

## 4. Implementation Notes

All logic is browser-local — no backend changes required beyond spec 005 providing `due_date`.

### Notification hook (`useTaskNotifications`)

```typescript
// hooks/use-task-notifications.ts
export function useTaskNotifications(tasks: Task[]) {
  // Tracks which task IDs have already been notified this session
  const notifiedRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (Notification.permission !== "granted") return;
    const check = () => {
      const now = Date.now();
      tasks.forEach((task) => {
        if (task.completed || !task.due_date) return;
        if (notifiedRef.current.has(task.id)) return;
        const due = new Date(task.due_date).getTime();
        const diffMs = due - now;
        if (diffMs <= 60 * 60 * 1000) {   // due within 1 hour or overdue
          notifiedRef.current.add(task.id);
          const n = new Notification(task.title, {
            body: diffMs < 0
              ? `Overdue since ${new Intl.DateTimeFormat(undefined, { timeStyle: "short" }).format(due)}`
              : `Due at ${new Intl.DateTimeFormat(undefined, { timeStyle: "short" }).format(due)}`,
          });
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

### Permission button component

```tsx
// components/features/tasks/notification-permission-button.tsx
"use client";
export function NotificationPermissionButton() {
  const [permission, setPermission] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );
  const request = async () => {
    const result = await Notification.requestPermission();
    setPermission(result);
    // toast success or denied message
  };
  if (permission === "granted") return <Badge>Reminders On</Badge>;
  return <Button onClick={request}>Enable Reminders</Button>;
}
```

---

## 5. Constraints

- **No backend changes** — purely frontend feature (requires spec 005's `due_date`)
- **No new npm packages** — uses browser-native `Notification` API only
- `Notification` API is not available in SSR; all code behind `"use client"` with `typeof Notification !== "undefined"` guard
- Polling interval: 60 seconds (balance between responsiveness and performance)
- Deduplication is session-scoped only (in-memory `Set` in a `useRef`)
