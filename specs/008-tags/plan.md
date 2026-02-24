# Plan 008: Tags

**Feature:** `008-tags`
**Spec:** `specs/008-tags/spec.md`
**Constitution ref:** v1.2.0 § V (tags + task_tags schema), § VII (add_tag, tag_task MCP tools), § VIII (tag uniqueness per user, idempotent create)
**Status:** Draft
**Date:** 2026-02-23

---

## Architectural Overview

Tags are stored in a `tags` table (id, user_id, name, color) with a UNIQUE constraint on `(user_id, name)`. The many-to-many join is in `task_tags`. Tag CRUD uses dedicated endpoints (`/api/{user_id}/tags`). Task create/update accepts `tag_ids: list[int]` which are resolved server-side. Task responses embed a `tags: list[TagRead]` array. Two new MCP tools (`add_tag`, `tag_task`) are added to the Cohere tool catalogue.

### Key decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Tag-task join | Separate `task_tags` table | Clean many-to-many; CASCADE on delete |
| Duplicate tag creation | Return existing (idempotent, no 409) | Constitution § VIII contract; simpler for AI tool use |
| Tag color | Optional hex string, default `#6366f1` | Matches app accent; no color picker needed |
| Tags in task response | Embedded array (not separate fetch) | Single round-trip; simpler frontend logic |

---

## Phases

### Phase 1 — Database: New Tables

**Goal:** Create `tags` and `task_tags` tables.

**Approach:** Add SQLModel classes; `create_all` in lifespan creates them automatically (they don't exist yet).

**Files to modify:**
- `backend/models.py` — add `Tag`, `TaskTag` SQLModel table classes; add `TagCreate`, `TagRead` Pydantic models; extend `TaskCreate`, `TaskUpdate` with `tag_ids: list[int]`; extend `TaskRead` with `tags: list[TagRead]`

```python
class Tag(SQLModel, table=True):
    __tablename__ = "tags"
    id: int | None = Field(default=None, primary_key=True)
    user_id: str = Field(sa_column=Column(String, nullable=False, index=True))
    name: str = Field(sa_column=Column(String(50), nullable=False))
    color: str = Field(sa_column=Column(String(7), nullable=False, server_default="#6366f1"))

    __table_args__ = (UniqueConstraint("user_id", "name"),)

class TaskTag(SQLModel, table=True):
    __tablename__ = "task_tags"
    task_id: int = Field(foreign_key="tasks.id", primary_key=True)
    tag_id: int = Field(foreign_key="tags.id", primary_key=True)
```

**Acceptance checks:**
- [ ] `tags` and `task_tags` tables exist in Neon DB after restart
- [ ] UNIQUE constraint on `(user_id, name)` enforced

---

### Phase 2 — Backend: Tag Endpoints

**Goal:** Implement `/api/{user_id}/tags` CRUD.

**New file:** `backend/routes/tags.py`

```python
router = APIRouter(prefix="/api")

@router.get("/{user_id}/tags")     # list user's tags
@router.post("/{user_id}/tags")    # create or return existing
@router.delete("/{user_id}/tags/{tag_id}")  # delete (204)
```

**Idempotent create:**
```python
existing = session.exec(
    select(Tag).where(Tag.user_id == user_id, Tag.name == body.name)
).first()
if existing:
    return existing
```

**Files to modify:**
- `backend/routes/tags.py` (new)
- `backend/main.py` — register `tags_router`

**Acceptance checks:**
- [ ] `POST /api/{user_id}/tags {"name":"work"}` creates tag
- [ ] Duplicate `POST` returns same tag (not 409)
- [ ] `GET /api/{user_id}/tags` returns user-scoped tags only
- [ ] `DELETE /api/{user_id}/tags/{id}` returns 204; cascades task_tags

---

### Phase 3 — Backend: Task CRUD with Tags

**Goal:** Extend task create/update to accept `tag_ids` and return embedded `tags`.

**Files to modify:**
- `backend/routes/tasks.py` — resolve `tag_ids` → `task_tags` rows on create/update; join tags into `TaskRead`
- `backend/models.py` — `TaskRead.tags: list[TagRead] = []`

**Tag resolution on create:**
```python
for tag_id in (body.tag_ids or []):
    tag = session.get(Tag, tag_id)
    if tag and tag.user_id == user_id:
        session.add(TaskTag(task_id=task.id, tag_id=tag_id))
```

**Task response tag embedding:**
```python
def enrich_task(task: Task, session: Session) -> TaskRead:
    tags = session.exec(
        select(Tag).join(TaskTag).where(TaskTag.task_id == task.id)
    ).all()
    return TaskRead(**task.model_dump(), tags=[TagRead.model_validate(t) for t in tags])
```

**Filter by tag:**
```python
if tag_id:
    statement = statement.join(TaskTag).where(TaskTag.tag_id == tag_id)
```

**Acceptance checks:**
- [ ] `POST /api/tasks {"tag_ids":[1,2]}` creates task_tags rows
- [ ] `GET /api/tasks` response includes `"tags": [...]` per task
- [ ] `GET /api/tasks?tag=1` returns only tasks with that tag
- [ ] Tag from another user not applied (ownership check)

---

### Phase 4 — Backend: MCP Tool Extensions

**Goal:** Add `add_tag` and `tag_task` tools; extend `add_task` with `tags` param.

**Files to modify:**
- `backend/tools/task_tools.py`

```python
def add_tag(session, user_id, name, color="#6366f1") -> dict:
    """Create tag or return existing."""

def tag_task(session, user_id, task_id, tag_name) -> dict:
    """Apply named tag to task; create tag if needed."""

def add_task(session, user_id, title, ..., tags=None) -> dict:
    # tags: list[str] of tag names
```

**Cohere tool schema additions** (`backend/routes/chat.py`):
```json
{ "name": "add_tag", "description": "Create a new tag (or return existing) with a name and optional hex color.", ... },
{ "name": "tag_task", "description": "Apply a named tag to a task. Creates the tag if it does not exist.", ... }
```

**Acceptance checks:**
- [ ] `add_tag(name="work")` returns tag dict
- [ ] `add_tag(name="work")` called again returns same tag (idempotent)
- [ ] `tag_task(task_id=1, tag_name="work")` applies tag

---

### Phase 5 — Frontend: Types + API

**Files to modify:**
- `frontend/src/types/index.ts` — add `Tag` interface; add `tags?: Tag[]` to `Task`; add `tag_ids?: number[]` to `CreateTaskPayload`, `UpdateTaskPayload`
- `frontend/src/lib/api.ts` — add `getTags(userId)`, `createTag(userId, payload)`, `deleteTag(userId, tagId)`; add `tag` filter to `getTasks`

---

### Phase 6 — Frontend: UI Components

**New components:**
- `TagChip` — `frontend/src/components/features/tasks/tag-chip.tsx` — coloured pill using `tag.color`
- `TagMultiSelect` — `frontend/src/components/features/tasks/tag-multi-select.tsx` — shadcn Popover + checkbox list + inline create

**Modified components:**
- `TaskCard` — render `<TagChip>` list below title
- `TaskCreateDialog` — add `<TagMultiSelect>` (loads tags from API on open)
- `TaskEditDialog` — add `<TagMultiSelect>` pre-populated from task's current tags
- `TaskFilters` — add tag filter select

**Acceptance checks:**
- [ ] Tag chips render with correct background colour
- [ ] Creating task with 2 tags shows both chips on card
- [ ] Tag filter shows only tagged tasks
- [ ] TypeScript: 0 errors

---

### Phase 7 — Testing

| Test | Expected |
|------|----------|
| `POST /api/{user_id}/tags {"name":"work"}` | 200, tag returned |
| Duplicate tag POST | Same tag returned (not error) |
| `POST /api/tasks {"tag_ids":[1]}` | Task has tag in response |
| `GET /api/tasks?tag=1` | Only tagged tasks |
| NL: "tag task 3 as 'shopping'" | `tag_task(task_id=3, tag_name="shopping")` |
| Tag from User B applied to User A task | 403 / ignored |
| TypeScript diagnostics | 0 errors |

---

## Risks & Mitigations

| Risk | Blast radius | Mitigation |
|------|-------------|------------|
| UniqueConstraint import missing | Startup error | Import `UniqueConstraint` from `sqlalchemy` |
| Cross-user tag applied via `tag_ids` | Security leak | Validate `tag.user_id == user_id` before inserting task_tag |
| Large tag list in task response N+1 | Slow list endpoint | Use JOIN query in `enrich_task`; not a per-task fetch |

📋 **Architectural decision detected:** `task_tags` introduces a many-to-many join that must be eagerly loaded in every task list query. Document the join strategy and N+1 prevention approach? Run `/sp.adr tags-join-strategy`
