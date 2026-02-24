# Plan 007: Task Priorities

**Feature:** `007-priorities`
**Spec:** `specs/007-priorities/spec.md`
**Constitution ref:** v1.2.0 § V (priority column, 422 on invalid), § VII (NL priority inference), § VIII (priority enum: low/medium/high/urgent; default medium)
**Status:** Draft
**Date:** 2026-02-23

---

## Architectural Overview

Priority is a string column on `tasks` with a `server_default` of `'medium'`. It is validated at the Pydantic layer (Literal type) so invalid values return 422 before hitting the DB. Sort-by-priority uses a SQL CASE expression to map string values to a numeric weight. No PostgreSQL ENUM type is used (avoids migration complexity when adding new values).

### Key decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Column type | `VARCHAR(10)` with server_default | Simpler than PG ENUM; easy to extend |
| Validation | Pydantic `Literal["low","medium","high","urgent"]` | 422 before DB hit; no DB constraint needed |
| Sort | SQL CASE expression | No application-level sort; consistent with other sorts |
| UI colour | Tailwind static classes | No dynamic class generation; maps statically |

---

## Phases

### Phase 1 — Database Migration

**Goal:** Add `priority` column with default `'medium'` to `tasks`.

**Approach:** Add to lifespan ALTER block in `main.py`:
```sql
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority VARCHAR(10) NOT NULL DEFAULT 'medium';
CREATE INDEX IF NOT EXISTS ix_tasks_priority ON tasks (priority);
```

**Files to modify:**
- `backend/main.py` — add ALTER TABLE in lifespan startup
- `backend/models.py` — add `priority` field to `Task`, `TaskCreate`, `TaskUpdate`, `TaskRead`

```python
# models.py
priority: str = Field(
    sa_column=Column(String(10), nullable=False, server_default="medium", index=True),
    default="medium",
)

# TaskCreate / TaskUpdate Pydantic validation
from typing import Literal
PriorityLiteral = Literal["low", "medium", "high", "urgent"]

class TaskCreate(BaseModel):
    ...
    priority: PriorityLiteral = "medium"

class TaskUpdate(BaseModel):
    ...
    priority: PriorityLiteral | None = None
```

**Acceptance checks:**
- [ ] `tasks.priority` column exists in Neon DB after restart
- [ ] Existing rows have `priority = 'medium'`
- [ ] `POST /api/tasks {"priority":"invalid"}` → 422

---

### Phase 2 — Backend: Filtering + Sorting

**Goal:** Support `?priority=` filter and `?sort=priority` on the list endpoint.

**Files to modify:**
- `backend/routes/tasks.py`

```python
# Priority filter
if priority:
    statement = statement.where(Task.priority == priority)

# Priority sort (descending urgency)
PRIORITY_WEIGHT = case(
    (Task.priority == "urgent", 4),
    (Task.priority == "high", 3),
    (Task.priority == "medium", 2),
    (Task.priority == "low", 1),
    else_=2,
)
if sort == "priority":
    statement = statement.order_by(PRIORITY_WEIGHT.desc())
```

**Acceptance checks:**
- [ ] `GET /api/tasks?priority=high` returns only high-priority tasks
- [ ] `GET /api/tasks?sort=priority` returns urgent first, low last
- [ ] `GET /api/tasks?priority=invalid` returns 422

---

### Phase 3 — Backend: MCP Tool Extensions

**Goal:** Extend `add_task` and `update_task` to accept `priority`.

**Files to modify:**
- `backend/tools/task_tools.py`

```python
VALID_PRIORITIES = {"low", "medium", "high", "urgent"}

def add_task(session, user_id, title, description=None, due_date=None,
             priority="medium") -> dict:
    if priority not in VALID_PRIORITIES:
        return {"error": f"Invalid priority '{priority}'. Use: low, medium, high, urgent."}
    ...

def update_task(session, user_id, task_id, ..., priority=None) -> dict:
    if priority is not None and priority not in VALID_PRIORITIES:
        return {"error": f"Invalid priority '{priority}'."}
    ...
```

**Cohere tool schema update** (`backend/routes/chat.py`):
```json
{
  "name": "priority",
  "description": "Task priority level: 'low', 'medium' (default), 'high', or 'urgent'. Infer from words like 'urgent', 'critical', 'ASAP' → 'urgent'; 'important', 'high priority' → 'high'; 'whenever', 'low priority' → 'low'.",
  "type": "str",
  "required": false
}
```

**Acceptance checks:**
- [ ] `add_task(priority="high")` stores `high` in DB
- [ ] `add_task(priority="critical")` returns error dict (Cohere maps before calling)
- [ ] Tool result includes `"priority"` key in response dict

---

### Phase 4 — Frontend: Types + API Client

**Files to modify:**
- `frontend/src/types/index.ts` — add `priority: "low" | "medium" | "high" | "urgent"` to `Task`; add `priority?` to `CreateTaskPayload`, `UpdateTaskPayload`
- `frontend/src/lib/api.ts` — add `priority` support to filter params in `getTasks()`

**Acceptance checks:**
- [ ] TypeScript: 0 errors on updated types
- [ ] `getTasks({ priority: "high" })` adds `?priority=high` to URL

---

### Phase 5 — Frontend: UI Components

**New component:** `PriorityBadge`
**File:** `frontend/src/components/features/tasks/priority-badge.tsx`

```tsx
const CONFIG = {
  low:    { label: "Low",    className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" },
  medium: { label: "Medium", className: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
  high:   { label: "High",   className: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300" },
  urgent: { label: "Urgent", className: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" },
};
```

**New component:** `PrioritySelect`
**File:** `frontend/src/components/features/tasks/priority-select.tsx`
- shadcn/ui `Select` with four options; default "medium"

**Modified components:**
- `TaskCard` — add `<PriorityBadge priority={task.priority} />` (beside due date badge)
- `TaskCreateDialog` — add `<PrioritySelect>` field
- `TaskEditDialog` — add `<PrioritySelect>` pre-populated from `task.priority`
- `TaskFilters` — add priority `<Select>` dropdown; on change sets `?priority=` filter

**Acceptance checks:**
- [ ] Cards show correct colour-coded badge
- [ ] Create form defaults to Medium; submit stores correct value
- [ ] Filter by priority shows only matching tasks
- [ ] TypeScript: 0 errors

---

### Phase 6 — Cohere Integration Verification

**Test prompts:**
- "urgent: review the security report" → `add_task(priority="urgent")`
- "add a low priority task: organize bookmarks" → `add_task(priority="low")`
- "make task 5 high priority" → `update_task(task_id=5, priority="high")`
- "show my urgent tasks" → `list_tasks(priority="urgent")`

---

### Phase 7 — Testing

| Test | Expected |
|------|----------|
| `POST /api/tasks {"priority":"urgent"}` | 201, `priority: "urgent"` |
| `POST /api/tasks {"priority":"critical"}` | 422 |
| `GET /api/tasks?priority=high` | Only high tasks |
| `GET /api/tasks?sort=priority` | urgent first |
| NL: "urgent: fix the login bug" | Cohere calls `add_task(priority="urgent")` |
| PriorityBadge urgent | Red styling |
| TypeScript diagnostics | 0 errors |

---

## Risks & Mitigations

| Risk | Blast radius | Mitigation |
|------|-------------|------------|
| server_default "medium" not applied on existing rows | Wrong badge shown | ALTER TABLE uses NOT NULL DEFAULT; existing rows get default |
| Cohere maps "critical" to non-enum value | Tool error returned | Tool validates and returns error dict; Cohere surfaces it |
| SQL CASE import collision | Import error | Use `sqlalchemy.case` explicitly; not SQLModel's `case` |
