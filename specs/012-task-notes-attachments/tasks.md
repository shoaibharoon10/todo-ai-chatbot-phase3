# Tasks 012: Task Notes & Attachments

**Feature:** `012-task-notes-attachments`
**Plan:** `specs/012-task-notes-attachments/plan.md`
**Constitution ref:** v1.2.0 § V (notes TEXT column, additive-only), § VII (add_task/update_task notes param), § VIII (no file storage; plain text only)
**Date:** 2026-02-23
**Total tasks:** 10

---

## Phase 1 — Database Migration

### T001 — Add `notes` column to `tasks` table
**File:** `backend/main.py`
**Const. ref:** § V (schema extension additive-only), § VIII (plain text notes only)

- [x] Add to lifespan startup block:
  ```python
  conn.execute(text("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS notes TEXT"))
  ```
- [x] Verify: column exists in Neon DB after restart
- [x] Verify: existing tasks have `notes = NULL` (no data loss, no migration needed)

---

## Phase 2 — Backend: Models

### T002 — Extend SQLModel `Task` and Pydantic schemas with `notes`
**File:** `backend/models.py`
**Const. ref:** § V (TaskRead includes all fields); max 5000 chars per spec

- [x] Add to `Task` SQLModel:
  ```python
  notes: str | None = Field(sa_column=Column(Text, nullable=True), default=None)
  ```
- [x] Add to `TaskCreate`:
  ```python
  notes: str | None = PydanticField(default=None, max_length=5000)
  ```
- [x] Add to `TaskUpdate`:
  ```python
  notes: str | None = PydanticField(default=None, max_length=5000)
  ```
- [x] Add to `TaskRead`:
  ```python
  notes: str | None = None
  ```
- [x] Verify: `POST /api/tasks {"notes":"x" * 5001}` → 422
- [x] Verify: `GET /api/tasks` response includes `"notes": null` per task

> **Note:** No changes to `backend/routes/tasks.py` needed — `notes` flows automatically through `TaskCreate`/`TaskUpdate`/`TaskRead` Pydantic models into the existing CRUD handlers.

---

## Phase 3 — Backend: MCP Tool Extensions

### T003 — Extend `add_task` and `update_task` tools with `notes`
**File:** `backend/tools/task_tools.py`
**Const. ref:** § VII (tools are thin DB wrappers; NL parsing of note content is Cohere's job)

- [x] Add `notes: str | None = None` to `add_task` signature
- [x] Persist `notes` on `Task` row in `add_task` (pass directly to `Task(notes=notes)`)
- [x] Add `notes: str | None = None` to `update_task` signature
- [x] In `update_task`: distinguish "not provided" from "clear notes":
  - Use sentinel value or check explicitly: if `notes == ""` → set `task.notes = None`; elif `notes is not None` → set `task.notes = notes`; elif `notes is None` → leave unchanged
  - Recommended: add `clear_notes: bool = False` parameter; if True, set `task.notes = None`; else apply `notes` if provided
- [x] Return `"notes"` key in result dict as string or `""` (Cohere document format)
- [x] Verify: `add_task(notes="buy oat milk")` stores note in DB
- [x] Verify: `update_task(task_id=1, notes="updated note")` updates correctly
- [x] Verify: `update_task(task_id=1, clear_notes=True)` sets `notes = NULL`

---

## Phase 4 — Backend: Cohere Tool Schema

### T004 — Add `notes` parameter to `add_task` and `update_task` tool definitions
**File:** `backend/routes/chat.py`
**Const. ref:** § VII (Cohere is NLU layer; extracts note content from user message)

- [x] Add `notes` parameter to `add_task` tool schema:
  ```json
  {
    "name": "notes",
    "description": "Freeform notes or additional context for the task (max 5000 chars). Use when user says 'add a note', 'remind me to', 'with the following details', or provides detailed context beyond the title. Example: 'remember to bring the signed contract'.",
    "type": "str",
    "required": false
  }
  ```
- [x] Add same `notes` parameter to `update_task` tool schema
- [x] Add `clear_notes` boolean parameter to `update_task`:
  ```json
  {
    "name": "clear_notes",
    "description": "Set to true to remove/clear existing notes from the task.",
    "type": "bool",
    "required": false
  }
  ```
- [x] Verify: "add note to task 5: call client at 3pm" → Cohere calls `update_task(task_id=5, notes="call client at 3pm")`

---

## Phase 5 — Frontend: Types & API

### T005 — Extend TypeScript types and API client
**Files:** `frontend/src/types/index.ts`, `frontend/src/lib/api.ts`

- [x] Add `notes?: string | null` to `Task` interface
- [x] Add `notes?: string | null` to `CreateTaskPayload`
- [x] Add `notes?: string | null` to `UpdateTaskPayload`
- [x] No changes needed in `api.ts` function signatures — `notes` flows through existing `body` objects
- [x] Verify: TypeScript 0 errors across all modified type usages

---

## Phase 6 — Frontend: UI Components

### T006 — Create `TaskNotesSection` component
**File:** `frontend/src/components/features/tasks/task-notes-section.tsx` *(new file)*
**Const. ref:** § IV (Tailwind CSS only; `whitespace-pre-wrap` for plain text); § VIII (no markdown rendering)

- [x] `"use client"` directive
- [x] Props: `notes: string`
- [x] State: `open: boolean` (initially `false`)
- [x] Toggle button: small ghost Button with `ChevronDown`/`ChevronUp` icon + "Notes" text
- [x] Expanded content: `<p className="mt-1 whitespace-pre-wrap rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-400">{notes}</p>`
- [x] Verify: toggle works; multi-line notes display correctly with line breaks

---

## Phase 7 — Frontend: Component Wiring

### T007 — Add notes indicator and `TaskNotesSection` to `TaskCard`
**File:** `frontend/src/components/features/tasks/task-card.tsx`

- [x] Import `FileText` from `lucide-react` and `TaskNotesSection`
- [x] Show `<FileText className="h-3.5 w-3.5 text-slate-400" />` in card header when `task.notes` is non-null
- [x] Render `<TaskNotesSection notes={task.notes} />` below badges/title when `task.notes` is truthy
- [x] Verify: card with notes shows FileText icon; clicking "Notes" reveals text; card without notes shows neither

### T008 — Add collapsible notes textarea to `TaskCreateDialog`
**File:** `frontend/src/components/features/tasks/task-create-dialog.tsx`

- [x] Add `showNotes: boolean` state (initially `false`)
- [x] Add "+ Add Notes" toggle link below description field; clicking sets `showNotes = true` / "Remove Notes" sets it `false` and clears `notes`
- [x] When `showNotes`: render `<Textarea placeholder="Add notes..." maxLength={5000} value={notes} onChange={...} />`
- [x] Pass `notes: showNotes ? notes : null` to `createTask` call
- [x] Verify: notes textarea hidden by default; "+ Add Notes" shows it; notes included in API call

### T009 — Add notes textarea to `TaskEditDialog`
**File:** `frontend/src/components/features/tasks/task-edit-dialog.tsx`

- [x] Add `notes: string | null` state initialized from `task.notes`
- [x] Render `<Textarea label="Notes (optional)" placeholder="Add notes..." maxLength={5000} value={notes ?? ""} onChange={e => setNotes(e.target.value || null)} />` always visible in edit form
- [x] Pass `notes` (null clears the field) to `updateTask` call
- [x] Verify: edit form pre-populates existing notes; clearing textarea sends `notes: null`; saves correctly

---

## Phase 8 — End-to-End Testing

### T010 — Verify notes end-to-end
**Const. ref:** § VI (all CRUD operations complete; chatbot tool results persisted in DB)

| Check | Expected |
|-------|----------|
| `POST /api/tasks {"notes":"remember this"}` | `notes` in 201 response |
| `PUT /api/tasks/{id} {"notes":null}` | `notes: null` in response; icon gone |
| `POST /api/tasks {"notes":"x"*5001}` | 422 (Pydantic max_length) |
| Chat: "add note to task 5: call at 3pm" | `update_task(task_id=5, notes="call at 3pm")` |
| Chat: "clear notes on task 3" | `update_task(task_id=3, clear_notes=true)` |
| TaskCard with notes | `FileText` icon + collapsible "Notes" section |
| Notes expand/collapse toggle | Works; `whitespace-pre-wrap` for line breaks |
| Create dialog: "+ Add Notes" toggle | Shows textarea; note sent in API call |
| Edit dialog: pre-populated notes | Existing notes shown; update saves correctly |
| TypeScript diagnostics | 0 errors |
