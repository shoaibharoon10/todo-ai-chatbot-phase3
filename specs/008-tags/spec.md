# Spec 008: Tags

**Feature:** `008-tags`
**Phase:** 4 — Advanced Features
**Status:** Draft
**Date:** 2026-02-23
**Constitution ref:** v1.2.0 § V (tags + task_tags schema), § VII (tag_task MCP tool), § VIII (tag uniqueness per user)

---

## 1. Overview

Users can create colour-coded tags and apply them to tasks. Tags are displayed as chips on task cards and can be used to filter the task list. The AI chatbot can create tags and tag tasks via tool calls.

---

## 2. User Stories

### US1: Create tags

**As a user**, I want to create named, colour-coded tags to organise my tasks.

**Acceptance Criteria:**

| ID | Criterion |
|----|-----------|
| AC1.1 | `POST /api/{user_id}/tags` creates a tag with `name` and optional `color` (hex) |
| AC1.2 | Creating a tag with a duplicate name returns the existing tag (idempotent) |
| AC1.3 | Tags are scoped to the authenticated user — users cannot see each other's tags |
| AC1.4 | `GET /api/{user_id}/tags` returns all user's tags |

### US2: Apply tags to tasks

**As a user**, I want to tag a task with one or more tags.

**Acceptance Criteria:**

| ID | Criterion |
|----|-----------|
| AC2.1 | Task create form shows a multi-select tag picker (user's existing tags) |
| AC2.2 | Task edit form allows adding/removing tags |
| AC2.3 | `POST /api/tasks` and `PUT /api/tasks/{id}` accept `tag_ids: list[int]` |
| AC2.4 | Tags are returned in the task response as `tags: [{id, name, color}]` |

### US3: Filter tasks by tag

**As a user**, I want to filter my task list by a specific tag.

**Acceptance Criteria:**

| ID | Criterion |
|----|-----------|
| AC3.1 | `GET /api/tasks?tag=<tag_id>` returns only tasks with that tag |
| AC3.2 | Task filters UI includes a "Tag" multi-select dropdown |

### US4: AI chatbot can create tags and tag tasks

**As a user**, I want to say "tag task 3 as 'work'" and have the AI apply the tag.

**Acceptance Criteria:**

| ID | Criterion |
|----|-----------|
| AC4.1 | `add_tag(name, color?)` MCP tool creates or retrieves a tag |
| AC4.2 | `tag_task(task_id, tag_name)` MCP tool applies a named tag to a task |
| AC4.3 | AI confirms the action ("Tagged 'Buy groceries' with 'shopping'") |
| AC4.4 | `add_task` MCP tool accepts optional `tags: list[str]` (tag names, created on demand) |

---

## 3. Out of Scope

- Tag deletion from the UI (can be done via API DELETE endpoint)
- Tag renaming
- Nested / hierarchical tags

---

## 4. Database Schema

```sql
CREATE TABLE tags (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  name VARCHAR(50) NOT NULL,
  color VARCHAR(7) NOT NULL DEFAULT '#6366f1',
  UNIQUE (user_id, name)
);
CREATE INDEX ix_tags_user_id ON tags (user_id);

CREATE TABLE task_tags (
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, tag_id)
);
```

**SQLModel models:**
```python
class Tag(SQLModel, table=True):
    __tablename__ = "tags"
    id: int | None = Field(default=None, primary_key=True)
    user_id: str = Field(index=True)
    name: str = Field(max_length=50)
    color: str = Field(default="#6366f1", max_length=7)

class TaskTag(SQLModel, table=True):
    __tablename__ = "task_tags"
    task_id: int = Field(foreign_key="tasks.id", primary_key=True)
    tag_id: int = Field(foreign_key="tags.id", primary_key=True)
```

---

## 5. API Contract

### Tag endpoints

```
GET  /api/{user_id}/tags              → list[TagRead]
POST /api/{user_id}/tags              → TagRead
  body: { "name": str, "color": str? }
DELETE /api/{user_id}/tags/{tag_id}   → 204
```

### Task create/update (extended)

```json
POST /api/tasks
{
  "title": "string",
  "tag_ids": [1, 3]
}
```

### Task response (extended)

```json
{
  "id": 1,
  "tags": [
    { "id": 1, "name": "work", "color": "#6366f1" }
  ],
  ...
}
```

---

## 6. MCP Tool Changes

```python
def add_tag(session, user_id, name, color="#6366f1") -> dict
    """Create or return existing tag with this name."""

def tag_task(session, user_id, task_id, tag_name) -> dict
    """Apply named tag to task; creates tag if it doesn't exist."""

def add_task(session, user_id, title, description=None, due_date=None,
             priority="medium", tags=None) -> dict
    # tags: list[str] of tag names; each created/retrieved on demand
```

---

## 7. UI Components

- `TagChip` — small coloured pill with tag name
- `TagMultiSelect` — shadcn/ui Popover with checkbox list of user's tags + create-inline input
- Add `TagMultiSelect` to `TaskCreateDialog` and `TaskEditDialog`
- Add `TagChip` list to `TaskCard`
- Add tag filter to `TaskFilters`

---

## 8. Constraints

- No new npm packages
- Tag uniqueness enforced at DB level (UNIQUE constraint on user_id + name)
- Tag color defaults to indigo (`#6366f1`) matching the app's accent colour
- `task_tags` rows are deleted via CASCADE when a task or tag is deleted
- Tag responses are always returned nested inside task responses (no separate tag-list fetch needed in UI beyond initial load)
