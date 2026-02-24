# Spec 005: Due Dates & Reminders

**Feature:** `005-due-dates-reminders`
**Phase:** 4 — Advanced Features
**Status:** Draft
**Date:** 2026-02-23
**Constitution ref:** v1.2.0 § V (schema extension), § VII (NL date parsing), § VIII (due date format)

---

## 1. Overview

Allow users to assign a due date to any task. The UI shows due date badges on task cards, highlights overdue tasks in red, and the AI chatbot parses natural language dates ("due tomorrow", "due next Friday") into ISO timestamps via Cohere tool calling.

---

## 2. User Stories

### US1: Set a due date when creating a task

**As a user**, I want to set a due date when I create a task so I know when it needs to be done.

**Acceptance Criteria:**

| ID | Criterion |
|----|-----------|
| AC1.1 | Task create form has a date-picker field (optional) |
| AC1.2 | Selected date is sent as UTC ISO 8601 string in `POST /api/tasks` |
| AC1.3 | Backend stores `due_date` as nullable timestamp on the `tasks` row |
| AC1.4 | API response includes `due_date` field |

### US2: View and edit due dates on tasks

**As a user**, I want to see when my tasks are due and be able to change the date.

**Acceptance Criteria:**

| ID | Criterion |
|----|-----------|
| AC2.1 | Task cards display due date badge (formatted in user's local timezone) |
| AC2.2 | Overdue tasks (due_date < now, not completed) show badge in red |
| AC2.3 | Tasks due today show badge in amber |
| AC2.4 | Task edit form pre-populates the existing due date |
| AC2.5 | Clearing the date picker sends `due_date: null` and clears the field |

### US3: Filter tasks by overdue status

**As a user**, I want to filter my task list to see only overdue tasks.

**Acceptance Criteria:**

| ID | Criterion |
|----|-----------|
| AC3.1 | `GET /api/tasks?overdue=true` returns tasks where `due_date < now AND completed = false` |
| AC3.2 | Task filters UI includes an "Overdue" quick filter chip |

### US4: AI chatbot understands due dates

**As a user**, I want to say "add a task due tomorrow" and have the AI set the due date automatically.

**Acceptance Criteria:**

| ID | Criterion |
|----|-----------|
| AC4.1 | `add_task` MCP tool accepts optional `due_date: str` (ISO 8601) parameter |
| AC4.2 | `update_task` MCP tool accepts optional `due_date: str | null` parameter |
| AC4.3 | Cohere parses "due tomorrow", "due next Monday", "due in 3 days" into ISO dates |
| AC4.4 | AI confirms the resolved date in its response ("I've set the due date to Feb 25") |

---

## 3. Out of Scope

- Push notifications for due tasks (covered in spec 006)
- Recurring due dates (covered in spec 009)
- Time-of-day granularity in due dates (date-only is sufficient)

---

## 4. Database Schema Extension

```sql
ALTER TABLE tasks ADD COLUMN due_date TIMESTAMP WITH TIME ZONE;
CREATE INDEX ix_tasks_due_date ON tasks (due_date);
```

**SQLModel change:**
```python
due_date: datetime | None = Field(
    sa_column=Column(DateTime(timezone=True), nullable=True, index=True),
    default=None,
)
```

---

## 5. API Contract

### Task create/update (extended)

```json
POST /api/tasks
{
  "title": "string",
  "description": "string | null",
  "due_date": "2026-02-25T00:00:00Z | null"
}
```

### List tasks (extended filter)

```
GET /api/tasks?overdue=true
```

Returns tasks where `due_date < UTC now` and `completed = false`.

### Task response (extended)

```json
{
  "id": 1,
  "title": "string",
  "due_date": "2026-02-25T00:00:00Z | null",
  "completed": false,
  ...
}
```

---

## 6. MCP Tool Changes

```python
# Extended signatures
def add_task(session, user_id, title, description=None, due_date=None) -> dict
def update_task(session, user_id, task_id, title=None, description=None,
                completed=None, due_date=None) -> dict
```

Cohere tool schema additions:
```json
{
  "name": "due_date",
  "description": "ISO 8601 UTC datetime string for when the task is due, e.g. '2026-02-25T00:00:00Z'. Infer from natural language ('due tomorrow' → compute date). Omit if not mentioned.",
  "type": "str",
  "required": false
}
```

---

## 7. UI Components

- `DueDatePicker` — shadcn/ui Popover wrapping an `<input type="date">` (no additional date library)
- `DueDateBadge` — pill showing formatted date; color: green (future), amber (today), red (overdue)
- Add `DueDatePicker` to `TaskCreateDialog` and `TaskEditDialog`
- Add `DueDateBadge` to `TaskCard`
- Add "Overdue" chip to `TaskFilters`

---

## 8. Constraints

- No new npm packages for date formatting — use native `Intl.DateTimeFormat`
- No new npm packages for date picking — use native `<input type="date">`
- Backend date storage MUST be UTC; frontend display converts to local timezone
- Smallest viable diff: only tasks-related files and MCP tools modified
