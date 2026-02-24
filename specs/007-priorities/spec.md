# Spec 007: Task Priorities

**Feature:** `007-priorities`
**Phase:** 4 — Advanced Features
**Status:** Draft
**Date:** 2026-02-23
**Constitution ref:** v1.2.0 § V (schema extension, priority enum), § VII (NL priority parsing), § VIII (priority enum values)

---

## 1. Overview

Add a priority level to every task (low / medium / high / urgent). Priority is shown as a colour-coded badge on task cards, can be set via the create/edit forms, filtered in the task list, and set naturally via the AI chatbot ("high priority task: …").

---

## 2. User Stories

### US1: Set priority when creating a task

**As a user**, I want to assign a priority level when I create a task.

**Acceptance Criteria:**

| ID | Criterion |
|----|-----------|
| AC1.1 | Task create form has a priority selector (default: medium) |
| AC1.2 | Valid values: `low`, `medium`, `high`, `urgent` |
| AC1.3 | Backend stores `priority` as a string column with default `'medium'` |
| AC1.4 | `POST /api/tasks` with invalid priority returns 422 |

### US2: View and edit task priority

**As a user**, I want to see the priority of each task and change it.

**Acceptance Criteria:**

| ID | Criterion |
|----|-----------|
| AC2.1 | Task cards display a priority badge: Low (slate), Medium (blue), High (amber), Urgent (red) |
| AC2.2 | Task edit form pre-populates the current priority |
| AC2.3 | `PUT /api/tasks/{id}` accepts updated `priority` value |

### US3: Filter and sort by priority

**As a user**, I want to filter my task list to a specific priority or sort by urgency.

**Acceptance Criteria:**

| ID | Criterion |
|----|-----------|
| AC3.1 | `GET /api/tasks?priority=high` returns only high-priority tasks |
| AC3.2 | `GET /api/tasks?sort=priority` sorts descending: urgent → high → medium → low |
| AC3.3 | Task filters UI includes a priority dropdown |

### US4: AI chatbot understands priorities

**As a user**, I want to say "urgent: fix the bug" and have the AI set priority automatically.

**Acceptance Criteria:**

| ID | Criterion |
|----|-----------|
| AC4.1 | `add_task` MCP tool accepts optional `priority: str` parameter |
| AC4.2 | `update_task` MCP tool accepts optional `priority: str` parameter |
| AC4.3 | Cohere infers priority from phrases: "urgent", "high priority", "low priority", "critical" → maps to enum |
| AC4.4 | AI confirms priority in response ("Added 'Fix the bug' with urgent priority") |

---

## 3. Out of Scope

- Custom priority labels or colours
- Priority-based notifications (can be added to spec 006 as an extension)

---

## 4. Database Schema Extension

```sql
ALTER TABLE tasks ADD COLUMN priority VARCHAR(10) NOT NULL DEFAULT 'medium';
CREATE INDEX ix_tasks_priority ON tasks (priority);
```

**SQLModel change:**
```python
from typing import Literal
PriorityEnum = Literal["low", "medium", "high", "urgent"]

priority: str = Field(
    sa_column=Column(String(10), nullable=False, server_default="medium", index=True),
    default="medium",
)
```

**Pydantic validation in TaskCreate / TaskUpdate:**
```python
priority: PriorityEnum = "medium"
```

---

## 5. API Contract

### Task create/update (extended)

```json
POST /api/tasks
{
  "title": "string",
  "priority": "low | medium | high | urgent"
}
```

### List tasks (extended filter + sort)

```
GET /api/tasks?priority=high
GET /api/tasks?sort=priority
```

Priority sort order (descending urgency): `urgent=4 > high=3 > medium=2 > low=1`

### Task response (extended)

```json
{
  "id": 1,
  "priority": "high",
  ...
}
```

---

## 6. MCP Tool Changes

```python
PRIORITY_ORDER = {"urgent": 4, "high": 3, "medium": 2, "low": 1}
VALID_PRIORITIES = set(PRIORITY_ORDER.keys())

def add_task(session, user_id, title, description=None, due_date=None,
             priority="medium") -> dict
def update_task(session, user_id, task_id, title=None, description=None,
                completed=None, due_date=None, priority=None) -> dict
```

Cohere tool schema additions:
```json
{
  "name": "priority",
  "description": "Task priority: 'low', 'medium' (default), 'high', or 'urgent'. Infer from phrases like 'urgent', 'high priority', 'critical', 'not important'.",
  "type": "str",
  "required": false
}
```

---

## 7. UI Components

- `PriorityBadge` — pill with colour mapping: low=slate, medium=blue, high=amber, urgent=red
- `PrioritySelect` — shadcn/ui Select with four options; default medium
- Add `PrioritySelect` to `TaskCreateDialog` and `TaskEditDialog`
- Add `PriorityBadge` to `TaskCard`
- Add priority filter to `TaskFilters` (Select dropdown)

---

## 8. Constraints

- No new npm packages
- Priority stored as string (not PostgreSQL enum) for simplicity; validated at Pydantic layer
- Backend sort maps string priority to numeric weight in the SQL ORDER BY using CASE expression
- Default `'medium'` applied at DB level (server_default) so existing rows are not affected
