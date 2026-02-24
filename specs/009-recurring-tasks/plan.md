# Plan 009: Recurring Tasks

**Feature:** `009-recurring-tasks`
**Spec:** `specs/009-recurring-tasks/spec.md`
**Constitution ref:** v1.2.0 § IV (python-rrule = python-dateutil), § VII (NL recurrence via Cohere), § VIII (recurrence contract: complete → create next)
**Depends on:** spec 005 (`due_date` must exist on `tasks`)
**Status:** Draft
**Date:** 2026-02-23

---

## Architectural Overview

Recurrence is stored as an RFC 5545 RRULE string on the task. When a recurring task is completed, the backend computes the next occurrence using `python-dateutil`'s `rrulestr` and inserts a new task row. The original task's `recurrence_rule` is preserved on all occurrences (linked via `recurrence_parent_id`). The complete endpoint returns an extended response including `next_occurrence`.

### Key decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Recurrence format | RFC 5545 RRULE string | Standard format; `python-dateutil` parses it natively |
| Next-occurrence trigger | On complete (PATCH /complete) | Constitution § VIII contract; no background scheduler needed |
| Parent tracking | `recurrence_parent_id` FK to original | Enables chain visibility; constitution mandates |
| RRULE generation | Cohere model (NL → RRULE) | Constitution § VII — no NLU on backend |
| UI presets | 5 fixed options mapped to RRULE strings | Simple; no custom RRULE editor required |

---

## Phases

### Phase 1 — Database Migration

**Goal:** Add `recurrence_rule` and `recurrence_parent_id` columns.

**Approach:** Add to lifespan ALTER block in `main.py`:
```sql
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence_rule TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence_parent_id INTEGER REFERENCES tasks(id);
```

**Files to modify:**
- `backend/main.py` — add two ALTER TABLE statements in lifespan startup
- `backend/models.py` — add fields to `Task`, `TaskCreate`, `TaskUpdate`, `TaskRead`

```python
recurrence_rule: str | None = Field(
    sa_column=Column(Text, nullable=True), default=None
)
recurrence_parent_id: int | None = Field(
    sa_column=Column(Integer, ForeignKey("tasks.id", ondelete="SET NULL"), nullable=True),
    default=None,
)
```

**Acceptance checks:**
- [ ] Both columns exist in Neon DB after restart
- [ ] Existing tasks have both columns as NULL (no data loss)
- [ ] `TaskRead` serialises both fields

---

### Phase 2 — Backend: Recurrence Helper

**Goal:** Implement `compute_next_occurrence` utility.

**New file:** `backend/recurrence.py`

```python
from dateutil.rrule import rrulestr
from datetime import datetime, timezone, timedelta

def compute_next_occurrence(rule_str: str, after: datetime) -> datetime | None:
    """Return the first occurrence of rule_str strictly after `after`."""
    try:
        rule = rrulestr(rule_str, dtstart=after)
        # Search up to 2 years ahead
        horizon = after + timedelta(days=730)
        nxt = rule.after(after, inc=False)
        return nxt if nxt and nxt <= horizon else None
    except Exception:
        return None
```

**Files to modify:**
- `backend/recurrence.py` (new)
- `backend/requirements.txt` — add `python-dateutil` (explicit; it may be a transitive dep already)

**Acceptance checks:**
- [ ] `compute_next_occurrence("FREQ=DAILY", today)` → tomorrow
- [ ] `compute_next_occurrence("FREQ=WEEKLY;BYDAY=MO", today_thursday)` → next Monday
- [ ] Malformed RRULE returns `None` (no crash)

---

### Phase 3 — Backend: Extended Complete Endpoint

**Goal:** Detect recurrence on `PATCH /api/tasks/{id}/complete`; create next occurrence if applicable.

**Files to modify:**
- `backend/routes/tasks.py` — extend complete handler

```python
@router.patch("/{task_id}/complete")
def complete_task(task_id: int, ...):
    task.completed = not task.completed
    task.updated_at = datetime.now(timezone.utc)
    session.add(task)

    next_occurrence = None
    if task.completed and task.recurrence_rule and task.due_date:
        next_due = compute_next_occurrence(task.recurrence_rule, task.due_date)
        if next_due:
            new_task = Task(
                user_id=task.user_id,
                title=task.title,
                description=task.description,
                priority=getattr(task, "priority", "medium"),
                due_date=next_due,
                recurrence_rule=task.recurrence_rule,
                recurrence_parent_id=task.recurrence_parent_id or task.id,
            )
            session.add(new_task)
            session.flush()
            next_occurrence = TaskRead.model_validate(new_task)

    session.commit()
    return CompleteTaskResponse(
        **TaskRead.model_validate(task).model_dump(),
        next_occurrence=next_occurrence,
    )
```

**New Pydantic model:**
```python
class CompleteTaskResponse(TaskRead):
    next_occurrence: TaskRead | None = None
```

**Files to modify:**
- `backend/models.py` — add `CompleteTaskResponse`
- `backend/routes/tasks.py` — import `compute_next_occurrence`; extend complete handler

**Acceptance checks:**
- [ ] Completing non-recurring task: `next_occurrence: null`, behaviour unchanged
- [ ] Completing daily task: new task created with `due_date = tomorrow`, `recurrence_parent_id = original.id`
- [ ] `CompleteTaskResponse.next_occurrence` is `TaskRead` or `null`

---

### Phase 4 — Backend: MCP Tool Extension

**Goal:** Extend `add_task` to accept `recurrence_rule`; extend `complete_task` to trigger recurrence.

**Files to modify:**
- `backend/tools/task_tools.py`

```python
def add_task(session, user_id, title, ..., recurrence_rule=None) -> dict:
    if recurrence_rule:
        # Validate RRULE
        try:
            rrulestr(recurrence_rule, dtstart=datetime.now(timezone.utc))
        except Exception:
            return {"error": f"Invalid recurrence rule: {recurrence_rule}"}
    ...

def complete_task(session, user_id, task_id) -> dict:
    # Call existing logic; include next_occurrence in result dict
    ...
```

**Cohere tool schema update** (`backend/routes/chat.py`):
```json
{
  "name": "recurrence_rule",
  "description": "RFC 5545 RRULE string for recurring tasks. Generate from phrases: 'every day' → 'FREQ=DAILY', 'every weekday' → 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR', 'every Monday' → 'FREQ=WEEKLY;BYDAY=MO', 'every month' → 'FREQ=MONTHLY'. Omit if not a recurring task.",
  "type": "str",
  "required": false
}
```

**Acceptance checks:**
- [ ] `add_task(recurrence_rule="FREQ=DAILY")` stores rule
- [ ] `add_task(recurrence_rule="INVALID")` returns error dict
- [ ] `complete_task` result includes `next_occurrence` key when applicable

---

### Phase 5 — Frontend: Types + API

**Files to modify:**
- `frontend/src/types/index.ts` — add `recurrence_rule?: string | null`, `recurrence_parent_id?: number | null`, `next_occurrence?: Task | null` to `Task`; add `CompleteTaskResponse` interface
- `frontend/src/lib/api.ts` — `toggleTask` return type updated to `CompleteTaskResponse`

---

### Phase 6 — Frontend: UI Components

**New components:**
- `RecurrenceSelect` — `frontend/src/components/features/tasks/recurrence-select.tsx`
  - shadcn Select: None / Daily / Weekdays / Weekly / Monthly
  - Maps to RRULE strings: `null` / `FREQ=DAILY` / `FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR` / `FREQ=WEEKLY` / `FREQ=MONTHLY`
- `RecurrenceBadge` — `frontend/src/components/features/tasks/recurrence-badge.tsx`
  - Small pill showing human-readable label; only shown when `recurrence_rule` set
  - Maps RRULE → label: `FREQ=DAILY` → "Daily", `FREQ=WEEKLY;BYDAY=...` → "Weekdays", etc.

**Modified components:**
- `TaskCreateDialog` — add `<RecurrenceSelect>` field
- `TaskEditDialog` — add `<RecurrenceSelect>` pre-populated; clearing → `null`
- `TaskCard` — add `<RecurrenceBadge>` when `recurrence_rule` is set

**Complete task UX:** When a recurring task is toggled complete, show a toast:
"Recurring task completed — next occurrence created for [date]"

**Acceptance checks:**
- [ ] Creating daily task shows "Daily" badge on card
- [ ] Completing recurring task triggers toast with next date
- [ ] TypeScript: 0 errors

---

### Phase 7 — Testing

| Test | Expected |
|------|----------|
| `POST /api/tasks {"recurrence_rule":"FREQ=DAILY","due_date":"..."}` | Task created with rule |
| `PATCH /api/tasks/{id}/complete` on recurring | New task created; `next_occurrence` in response |
| `PATCH /complete` on non-recurring | `next_occurrence: null`; no new task |
| `compute_next_occurrence("INVALID", ...)` | Returns `None`; no crash |
| NL: "add a weekday standup task every morning" | Cohere calls `add_task(recurrence_rule="FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR")` |
| TypeScript diagnostics | 0 errors |

---

## Risks & Mitigations

| Risk | Blast radius | Mitigation |
|------|-------------|------------|
| `python-dateutil` not installed | Import error at startup | Add explicit dep to `requirements.txt` |
| RRULE generates occurrence in past | Confusing next task | `compute_next_occurrence` uses `after=task.due_date`; always future |
| Infinite recurrence loop in tool | Timeout | `horizon = after + 730 days` cap in `rrule.after()` |
| `recurrence_parent_id` FK constraint fails | 500 on insert | Check parent task existence; use `SET NULL` on delete |
