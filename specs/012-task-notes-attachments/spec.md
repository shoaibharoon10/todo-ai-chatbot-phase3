# Spec 012: Task Notes & Attachments

**Feature:** `012-task-notes-attachments`
**Phase:** 4 — Advanced Features
**Status:** Draft
**Date:** 2026-02-23
**Constitution ref:** v1.2.0 § V (schema extension — notes column), § VII (update_task MCP with notes param), § VIII (additive-only)

---

## 1. Overview

Users can add rich freeform notes to any task. Notes are stored as a text field on the task row and displayed in an expandable section on the task card. The AI chatbot can set, update, or read a task's notes via the `update_task` tool. File attachments are out of scope for this iteration (no file storage infrastructure).

---

## 2. User Stories

### US1: Add notes to a task when creating it

**As a user**, I want to add detailed notes to a task when I create it.

**Acceptance Criteria:**

| ID | Criterion |
|----|-----------|
| AC1.1 | Task create form has a collapsible "Add Notes" textarea (optional, max 5000 chars) |
| AC1.2 | Notes are submitted in `POST /api/tasks` as `notes: string | null` |
| AC1.3 | Backend stores `notes` as nullable Text column on `tasks` |
| AC1.4 | API response includes `notes` field |

### US2: View and edit task notes

**As a user**, I want to see and update a task's notes.

**Acceptance Criteria:**

| ID | Criterion |
|----|-----------|
| AC2.1 | Task cards with notes show a "Notes" expandable section (collapsed by default) |
| AC2.2 | Expanded section shows the notes text (pre-wrap for line breaks) |
| AC2.3 | A note icon indicator (FileText) on the card shows the task has notes |
| AC2.4 | Task edit form pre-populates the notes textarea |
| AC2.5 | `PUT /api/tasks/{id}` accepts updated `notes: string | null` |
| AC2.6 | Clearing the textarea and saving sets `notes: null` |

### US3: AI chatbot reads and writes notes

**As a user**, I want to say "add a note to task 5: bring the signed contract" and have the AI update it.

**Acceptance Criteria:**

| ID | Criterion |
|----|-----------|
| AC3.1 | `update_task` MCP tool accepts optional `notes: str | None` parameter |
| AC3.2 | `add_task` MCP tool accepts optional `notes: str | None` parameter |
| AC3.3 | AI confirms notes changes ("I've added a note to 'Fix bug': bring the signed contract") |
| AC3.4 | User can ask "what are my notes on task 5?" and the AI reads and returns them via `update_task` details or a list_tasks call |

---

## 3. Out of Scope

- File attachments (images, PDFs, etc.) — requires object storage (S3/R2); future amendment
- Rich text / markdown rendering in notes — plain text only
- Notes history / version tracking

---

## 4. Database Schema Extension

```sql
ALTER TABLE tasks ADD COLUMN notes TEXT;
```

**SQLModel change:**
```python
notes: str | None = Field(
    sa_column=Column(Text, nullable=True), default=None
)
```

No index needed — notes are not filtered or sorted.

---

## 5. API Contract

### Task create/update (extended)

```json
POST /api/tasks
{
  "title": "string",
  "notes": "Detailed note text here...\nWith line breaks."
}

PUT /api/tasks/{id}
{
  "notes": null
}
```

### Task response (extended)

```json
{
  "id": 1,
  "title": "Fix bug",
  "notes": "Reproduce on Chrome 122 with the dev account.",
  ...
}
```

---

## 6. MCP Tool Changes

```python
def add_task(session, user_id, title, description=None, due_date=None,
             priority="medium", tags=None, notes=None) -> dict

def update_task(session, user_id, task_id, title=None, description=None,
                completed=None, due_date=None, priority=None, notes=None) -> dict
```

Cohere tool schema additions:
```json
{
  "name": "notes",
  "description": "Freeform notes or additional context for the task (max 5000 chars). Use when the user says 'add a note', 'remind me to...', or provides detailed context beyond the title. Pass null to clear notes.",
  "type": "str",
  "required": false
}
```

---

## 7. UI Components

- `TaskNotesSection` — collapsible div (toggle with chevron) showing notes text with `whitespace-pre-wrap`
- `FileText` lucide icon indicator on `TaskCard` when `notes` is non-null
- Add notes `Textarea` to `TaskCreateDialog` (collapsed behind "Add Notes +" toggle)
- Add notes `Textarea` to `TaskEditDialog` (shown when task has notes or user expands)

---

## 8. Pydantic Schema Changes

```python
class TaskCreate(BaseModel):
    title: str = PydanticField(min_length=1, max_length=200)
    description: str | None = PydanticField(default=None, max_length=1000)
    notes: str | None = PydanticField(default=None, max_length=5000)

class TaskUpdate(BaseModel):
    title: str | None = PydanticField(default=None, min_length=1, max_length=200)
    description: str | None = PydanticField(default=None, max_length=1000)
    completed: bool | None = None
    notes: str | None = PydanticField(default=None, max_length=5000)

class TaskRead(BaseModel):
    id: int
    notes: str | None
    ...
```

---

## 9. Constraints

- No new npm packages
- Notes are plain text only (no Markdown parsing); rendered with `whitespace-pre-wrap` CSS
- Max 5000 characters enforced at Pydantic layer (422 if exceeded)
- `notes` column is nullable — existing rows default to NULL; no data migration required
- Smallest viable diff: only `models.py`, `routes/tasks.py`, `tools/task_tools.py`, and 3 frontend components modified
