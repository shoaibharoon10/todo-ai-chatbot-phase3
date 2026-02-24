# Tasks 008: Tags

**Feature:** `008-tags`
**Plan:** `specs/008-tags/plan.md`
**Constitution ref:** v1.2.0 § V (tags + task_tags schema), § VII (add_tag, tag_task MCP tools), § VIII (tag uniqueness per user, idempotent create)
**Date:** 2026-02-23
**Total tasks:** 13

---

## Phase 1 — Database: New Tables

### T001 — Create `Tag` and `TaskTag` SQLModel classes
**File:** `backend/models.py`
**Const. ref:** § V (tags table schema), § VIII (UNIQUE(user_id, name), CASCADE on delete)

- [x] Add imports: `from sqlalchemy import UniqueConstraint`
- [x] Add `Tag` SQLModel table class with `__table_args__` UniqueConstraint
- [x] Add `TaskTag` SQLModel table class with CASCADE FK on both task_id and tag_id
- [x] Add `TagCreate(BaseModel)`: `name`, `color`
- [x] Add `TagRead(BaseModel)`: `id`, `name`, `color` + `model_config`
- [x] Extend `TaskCreate`: add `tag_ids: list[int] = []`
- [x] Extend `TaskUpdate`: add `tag_ids: list[int] | None = None`
- [x] Extend `TaskRead`: add `tags: list[TagRead] = []`
- [x] Verify: `SQLModel.metadata.create_all` creates both tables on startup

---

## Phase 2 — Backend: Tag Endpoints

### T002 — Create `backend/routes/tags.py`
**Const. ref:** § V (GET/POST/DELETE `/api/{user_id}/tags`), § II (user isolation), § VIII (idempotent create)

- [x] New file with `router = APIRouter(prefix="/api")`
- [x] `GET /{user_id}/tags` — return all tags for the user
- [x] `POST /{user_id}/tags` — idempotent create (returns existing if name matches)
- [x] `DELETE /{user_id}/tags/{tag_id}` — 403 if tag belongs to different user; 204 on success
- [x] All endpoints require JWT (`get_current_user`); enforce `current_user == user_id`
- [x] Verify: duplicate POST returns same tag (not 409 or 201 with new row)

### T003 — Register tags router in `main.py`
**File:** `backend/main.py`

- [x] Import `tags_router` from `routes.tags`
- [x] Add `app.include_router(tags_router)`
- [x] Verify: `GET /api/{user_id}/tags` returns 200 (empty list for new user)

---

## Phase 3 — Backend: Task CRUD with Tags

### T004 — Extend task create/update/read endpoints with tags
**File:** `backend/routes/tasks.py`
**Const. ref:** § II (tag ownership must be verified; cross-user tags rejected), § VIII (tag cascade)

- [x] Create helper `enrich_task_with_tags(task, session) -> TaskRead` using JOIN query
- [x] In `POST /api/tasks` (create): after flushing task, resolve `body.tag_ids` and insert `TaskTag` rows
- [x] In `PUT /api/tasks/{id}` (update): pop tag_ids from update_data; delete existing TaskTag rows; re-insert with validated new tags
- [x] In `GET /api/tasks` (list): return `[enrich_task_with_tags(t, session) for t in tasks]`
- [x] In `GET /api/tasks/{id}` (single): return `enrich_task_with_tags(task, session)`
- [x] Add `tag: int | None = None` filter with JOIN + WHERE clause
- [x] Verify: `POST /api/tasks {"tag_ids":[1]}` → response has `"tags":[{...}]`
- [x] Verify: tag from another user silently ignored (not applied)

---

## Phase 4 — Backend: MCP Tool Extensions

### T005 — Add `add_tag` and `tag_task` tools; extend `add_task`
**File:** `backend/tools/task_tools.py`
**Const. ref:** § VII (add_tag idempotent; tag_task creates tag on demand)

- [x] Add `add_tag(session, user_id, name, color="#6366f1") -> dict`: idempotent, returns existing
- [x] Add `tag_task(session, user_id, task_id, tag_name) -> dict`: verify task, add_tag, insert TaskTag
- [x] Extend `add_task(... tags=None)`: iterate tag names → `add_tag` → insert `TaskTag`
- [x] All result values as strings (Cohere document format requirement)

### T006 — Add `add_tag` and `tag_task` to Cohere tool catalogue
**File:** `backend/routes/chat.py`
**Const. ref:** § VII (MCP tools registered in TOOLS list; dispatched in tool-call loop)

- [x] Add `add_tag` tool schema to TOOLS list
- [x] Add `tag_task` tool schema to TOOLS list
- [x] Register both in TOOL_DISPATCH
- [x] Add `tags` parameter to `add_task` tool schema (list of tag names)
- [x] Verify: "tag task 3 as 'shopping'" → Cohere calls `tag_task(task_id=3, tag_name="shopping")`

---

## Phase 5 — Frontend: Types & API

### T007 — Extend TypeScript types and API client
**Files:** `frontend/src/types/index.ts`, `frontend/src/lib/api.ts`

- [x] Add `Tag` interface: `{ id: number; name: string; color: string; }`
- [x] Add `tags?: Tag[]` to `Task` interface
- [x] Add `tag_ids?: number[]` to `CreateTaskPayload` and `UpdateTaskPayload`
- [x] Add `getTags(userId: string): Promise<Tag[]>` to `api.ts`
- [x] Add `createTag(userId: string, payload: { name: string; color?: string }): Promise<Tag>` to `api.ts`
- [x] Add `deleteTag(userId: string, tagId: number): Promise<void>` to `api.ts`
- [x] Add `tag?: number` filter to `getTasks` (appends `?tag=<id>`)
- [x] Verify: TypeScript 0 errors

---

## Phase 6 — Frontend: UI Components

### T008 — Create `TagChip` component
**File:** `frontend/src/components/features/tasks/tag-chip.tsx` *(new file)*

- [x] Render small pill with `tag.name`; background colour from `tag.color` (hex via inline style)
- [x] Text colour: white
- [x] Props: `tag: Tag`
- [x] Verify: renders with correct background colour

### T009 — Create `TagMultiSelect` component
**File:** `frontend/src/components/features/tasks/tag-multi-select.tsx` *(new file)*
**Const. ref:** § IV (shadcn/ui Popover; no third-party multi-select library)

- [x] shadcn/ui `Popover` + `PopoverTrigger` + `PopoverContent` (created `components/ui/popover.tsx`)
- [x] Trigger: "Add Tags" button with `Tags` lucide icon
- [x] Content: list of user's tags with checkbox; checked = selected
- [x] Show selected tags as `<TagChip>` row below trigger
- [x] Props: `selectedIds: number[]; onChange: (ids: number[]) => void`
- [x] Load tags from `getTags(userId)` via `authClient.useSession()` on mount
- [x] Verify: tags load; checkbox toggles selection; chips update

### T010 — Wire `TagChip` + `TagMultiSelect` into dialogs, card, and filters
**Files:** `task-card.tsx`, `task-create-dialog.tsx`, `task-edit-dialog.tsx`, `task-filters.tsx`

- [x] `TaskCard`: render `<TagChip>` for each `tag` in `task.tags`
- [x] `TaskCreateDialog`: add `<TagMultiSelect>` field; pass `tag_ids` to `createTask`
- [x] `TaskEditDialog`: add `<TagMultiSelect>` pre-populated from `task.tags.map(t => t.id)`; pass updated `tag_ids` to `updateTask`
- [x] `TaskFilters`: add tag `Select` loaded from `getTags`; drives `?tag=<id>` filter

---

## Phase 7 — ADR Task

### T011 — Document tag-join query strategy
**Const. ref:** v1.2.0 § VIII; plan.md ADR suggestion

- [x] Decision recorded: single JOIN query per task via `enrich_task_with_tags()` helper;
  N+1 accepted for hackathon scope; no SQLModel relationship to avoid lazy-load issues.
  JOIN approach: `select(Tag).join(TaskTag, TaskTag.tag_id == Tag.id).where(TaskTag.task_id == task.id)`

---

## Phase 8 — End-to-End Testing

### T012 — Verify tags end-to-end

| Check | Expected |
|-------|----------|
| `POST /api/{user_id}/tags {"name":"work"}` | Tag created |
| Duplicate `POST` | Same tag returned (not error) |
| `POST /api/tasks {"tag_ids":[1]}` | Task has `tags:[{...}]` in response |
| `GET /api/tasks?tag=1` | Only tagged tasks returned |
| `DELETE /api/{user_id}/tags/{id}` | 204; task_tags rows deleted via CASCADE |
| Chat: "tag task 3 as 'shopping'" | `tag_task(task_id=3, tag_name="shopping")` |
| Tag from User B used by User A | Rejected (ownership check) |
| TagChip on task card | Correct colour rendered |
| TypeScript diagnostics | 0 errors |
