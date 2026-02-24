# Spec 009: Recurring Tasks

**Feature:** `009-recurring-tasks`
**Phase:** 4 — Advanced Features
**Status:** Draft
**Date:** 2026-02-23
**Constitution ref:** v1.2.0 § IV (python-rrule), § VII (NL recurrence via Cohere), § VIII (recurrence contract)
**Depends on:** spec 005 (due_date field on tasks)

---

## 1. Overview

Users can define tasks that repeat on a schedule (daily, weekly, weekdays, monthly, etc.). When a recurring task is marked complete, the backend automatically creates the next occurrence using the RFC 5545 RRULE string stored on the task. The AI chatbot understands recurrence phrases and generates correct RRULE strings via Cohere.

---

## 2. User Stories

### US1: Create a recurring task

**As a user**, I want to create a task that repeats on a schedule so I don't have to recreate it manually.

**Acceptance Criteria:**

| ID | Criterion |
|----|-----------|
| AC1.1 | Task create form includes a recurrence selector: None / Daily / Weekdays / Weekly / Monthly |
| AC1.2 | Selected recurrence is stored as an RRULE string in `recurrence_rule` (e.g., `FREQ=DAILY`) |
| AC1.3 | A task with `recurrence_rule` set also has a `due_date` as the first occurrence |
| AC1.4 | `recurrence_parent_id` is null for the original task; cloned occurrences point back to the original |

### US2: Auto-create next occurrence on completion

**As a user**, when I mark a recurring task as done, I want the next occurrence to be created automatically.

**Acceptance Criteria:**

| ID | Criterion |
|----|-----------|
| AC2.1 | `PATCH /api/tasks/{id}/complete` detects `recurrence_rule` on the task |
| AC2.2 | Backend uses `python-rrule` to compute the next due date after the current one |
| AC2.3 | A new task is created with the same title, description, priority, recurrence_rule, and the next due_date |
| AC2.4 | The new task's `recurrence_parent_id` points to the original task's id |
| AC2.5 | The API response includes `next_occurrence: TaskRead | null` |

### US3: Stop a recurring task

**As a user**, I want to stop a task from recurring without deleting it.

**Acceptance Criteria:**

| ID | Criterion |
|----|-----------|
| AC3.1 | `PUT /api/tasks/{id}` with `recurrence_rule: null` clears the recurrence |
| AC3.2 | Future completions of that task no longer auto-create new occurrences |

### US4: AI chatbot creates recurring tasks

**As a user**, I want to say "add a daily standup task every weekday" and have the AI create it with recurrence.

**Acceptance Criteria:**

| ID | Criterion |
|----|-----------|
| AC4.1 | `add_task` MCP tool accepts optional `recurrence_rule: str` (RRULE string) parameter |
| AC4.2 | Cohere generates correct RRULE from natural language: "every day" → `FREQ=DAILY`, "every weekday" → `FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR`, "every Monday" → `FREQ=WEEKLY;BYDAY=MO` |
| AC4.3 | AI confirms recurrence in response ("I've set 'Daily standup' to repeat every weekday") |

---

## 3. Out of Scope

- Custom RRULE editor (UI only exposes presets; raw RRULE is AI/API-only)
- End date / count for recurrence (UNTIL / COUNT RRULE clauses) — future amendment
- Recurrence exceptions (EXDATE) — future amendment

---

## 4. Database Schema Extension

```sql
ALTER TABLE tasks ADD COLUMN recurrence_rule TEXT;
ALTER TABLE tasks ADD COLUMN recurrence_parent_id INTEGER REFERENCES tasks(id);
```

**SQLModel change:**
```python
recurrence_rule: str | None = Field(
    sa_column=Column(Text, nullable=True), default=None
)
recurrence_parent_id: int | None = Field(
    sa_column=Column(Integer, ForeignKey("tasks.id"), nullable=True), default=None
)
```

---

## 5. API Contract

### Task create/update (extended)

```json
POST /api/tasks
{
  "title": "Daily standup",
  "due_date": "2026-02-24T09:00:00Z",
  "recurrence_rule": "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR"
}
```

### Complete task response (extended)

```json
{
  "id": 1,
  "completed": true,
  "next_occurrence": {
    "id": 2,
    "title": "Daily standup",
    "due_date": "2026-02-25T09:00:00Z",
    "recurrence_rule": "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR",
    "recurrence_parent_id": 1
  }
}
```

---

## 6. Backend: Recurrence Logic

```python
from dateutil.rrule import rrulestr
from datetime import datetime, timezone

def compute_next_occurrence(rule_str: str, from_date: datetime) -> datetime | None:
    """Return the next occurrence after from_date using the RRULE string."""
    rule = rrulestr(rule_str, dtstart=from_date)
    candidates = list(rule.between(from_date, from_date.replace(year=from_date.year + 5), inc=False))
    return candidates[0] if candidates else None
```

Called inside `complete_task()` in `task_tools.py`. If next date found, insert new task row.

**Dependency:** `python-rrule` (which ships as `python-dateutil` — `dateutil.rrule`).
Add to `backend/requirements.txt`: `python-dateutil` (already a transitive dep; make explicit).

---

## 7. UI Components

- `RecurrenceSelect` — shadcn/ui Select with options: None, Daily, Weekdays, Weekly, Monthly
  - Maps to: null, `FREQ=DAILY`, `FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR`, `FREQ=WEEKLY`, `FREQ=MONTHLY`
- `RecurrenceBadge` — small pill showing "Daily" / "Weekdays" etc. on task cards
- Add `RecurrenceSelect` to `TaskCreateDialog` and `TaskEditDialog`
- Add `RecurrenceBadge` to `TaskCard` when `recurrence_rule` is set

---

## 8. Constraints

- `python-rrule` is already available as `python-dateutil`; add explicit dep to requirements.txt
- RRULE parsing errors from malformed strings MUST return 422 with clear message
- Next occurrence computed server-side only; no client-side date arithmetic
- Recurrence preset UI maps to fixed RRULE strings; no free-form RRULE UI input
- Completing a non-recurring task is unchanged (no performance impact)
