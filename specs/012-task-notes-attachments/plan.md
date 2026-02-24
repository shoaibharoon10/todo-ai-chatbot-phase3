# Plan 012: Task Notes & Attachments

**Feature:** `012-task-notes-attachments`
**Spec:** `specs/012-task-notes-attachments/spec.md`
**Constitution ref:** v1.2.0 § V (notes column, additive-only), § VII (update_task/add_task with notes param), § VIII (additive-only, no attachment storage)
**Status:** Draft
**Date:** 2026-02-23

---

## Architectural Overview

Notes are a single nullable `TEXT` column on the `tasks` table. No separate table, no file storage. The feature is purely additive: `TaskCreate` and `TaskUpdate` gain an optional `notes` field; `TaskRead` gains `notes`; `add_task` and `update_task` MCP tools gain a `notes` parameter. Frontend adds a collapsible notes section to `TaskCard` and textarea fields to create/edit dialogs.

### Key decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Storage | TEXT column on `tasks` | Constitution § VIII — additive only; no separate table |
| Rendering | `whitespace-pre-wrap` CSS | Plain text; no markdown parser needed |
| Max length | 5000 chars (Pydantic) | Prevents abuse; matches spec |
| UX | Collapsible section on card | Cards stay compact; notes revealed on demand |
| Indicator | `FileText` lucide icon | Clear signal without cluttering card |

---

## Phases

### Phase 1 — Database Migration

**Goal:** Add `notes` column to `tasks` table.

**Approach:** Add to lifespan ALTER block in `main.py`:
```sql
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS notes TEXT;
```

**Files to modify:**
- `backend/main.py` — add ALTER TABLE
- `backend/models.py` — add `notes` field to `Task`, `TaskCreate`, `TaskUpdate`, `TaskRead`

```python
# Task SQLModel
notes: str | None = Field(
    sa_column=Column(Text, nullable=True), default=None
)

# TaskCreate / TaskUpdate Pydantic
notes: str | None = PydanticField(default=None, max_length=5000)

# TaskRead
notes: str | None = None
```

**Acceptance checks:**
- [ ] `tasks.notes` column exists after restart
- [ ] Existing tasks have `notes = NULL` (no data loss)
- [ ] `TaskRead.notes` serialises as string or `null`

---

### Phase 2 — Backend: API Extension

**Goal:** CRUD endpoints accept and return `notes`.

No new endpoint needed — `TaskCreate`, `TaskUpdate`, and `TaskRead` changes automatically flow through `POST /api/tasks` and `PUT /api/tasks/{id}`.

**Validation enforcement:**
```python
# TaskCreate / TaskUpdate already validated by Pydantic
# max_length=5000 → 422 if exceeded
```

**Acceptance checks:**
- [ ] `POST /api/tasks {"notes":"some text"}` stores notes
- [ ] `PUT /api/tasks/{id} {"notes":null}` clears notes
- [ ] `POST /api/tasks {"notes":"x" * 5001}` → 422

---

### Phase 3 — Backend: MCP Tool Extensions

**Goal:** `add_task` and `update_task` accept and persist `notes`.

**Files to modify:**
- `backend/tools/task_tools.py`

```python
def add_task(session, user_id, title, description=None, due_date=None,
             priority="medium", tags=None, notes=None) -> dict:
    ...
    task = Task(
        ...,
        notes=notes,
    )

def update_task(session, user_id, task_id, ..., notes=None) -> dict:
    ...
    if notes is not None:
        task.notes = notes if notes != "" else None
```

**Cohere tool schema update** (`backend/routes/chat.py`):
```json
{
  "name": "notes",
  "description": "Freeform notes or context for the task (max 5000 chars). Use when user says 'add a note', 'remind me to...', or provides extra context beyond the title. Pass null or empty string to clear notes.",
  "type": "str",
  "required": false
}
```

**Acceptance checks:**
- [ ] `add_task(notes="bring the contract")` stores notes in DB
- [ ] `update_task(task_id=1, notes=None)` leaves notes unchanged (None = not provided)
- [ ] `update_task(task_id=1, notes="")` clears notes (empty string = clear)
- [ ] Tool result dict includes `"notes"` key (as string or empty string)

---

### Phase 4 — Frontend: Types + API Client

**Files to modify:**
- `frontend/src/types/index.ts` — add `notes?: string | null` to `Task`; add `notes?: string | null` to `CreateTaskPayload`, `UpdateTaskPayload`
- `frontend/src/lib/api.ts` — no structural change needed; `notes` flows through existing `body` object

**Acceptance checks:**
- [ ] TypeScript: 0 errors on updated types
- [ ] `createTask({ title: "x", notes: "buy oat milk" })` sends correct body

---

### Phase 5 — Frontend: UI Components

**New component:** `TaskNotesSection`
**File:** `frontend/src/components/features/tasks/task-notes-section.tsx`

```tsx
"use client";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props { notes: string; }

export function TaskNotesSection({ notes }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-2">
      <Button variant="ghost" size="sm" className="h-6 gap-1 px-1 text-xs text-slate-500"
        onClick={() => setOpen((v) => !v)}>
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        Notes
      </Button>
      {open && (
        <p className="mt-1 whitespace-pre-wrap rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-400">
          {notes}
        </p>
      )}
    </div>
  );
}
```

**Modified components:**

`TaskCard` — add notes indicator + section:
```tsx
import { FileText } from "lucide-react";
import { TaskNotesSection } from "./task-notes-section";

// In card header — show icon when notes present:
{task.notes && <FileText className="h-3.5 w-3.5 text-slate-400" />}

// Below task title/badges:
{task.notes && <TaskNotesSection notes={task.notes} />}
```

`TaskCreateDialog` — add collapsible notes textarea:
```tsx
// Below description field:
<div>
  <button type="button" onClick={() => setShowNotes(v => !v)}
    className="text-xs text-indigo-600 hover:underline">
    {showNotes ? "Remove Notes" : "+ Add Notes"}
  </button>
  {showNotes && (
    <Textarea placeholder="Add notes..." maxLength={5000}
      value={notes} onChange={e => setNotes(e.target.value)} />
  )}
</div>
```

`TaskEditDialog` — always show notes textarea (pre-populated from `task.notes`):
```tsx
<Textarea label="Notes" placeholder="Notes..." maxLength={5000}
  value={notes ?? ""} onChange={e => setNotes(e.target.value || null)} />
```

**Acceptance checks:**
- [ ] Task card with notes shows `FileText` icon
- [ ] Clicking "Notes" toggle reveals notes text with `whitespace-pre-wrap`
- [ ] Create form shows notes textarea after clicking "+ Add Notes"
- [ ] Edit form pre-populates notes; clearing and saving sets `notes: null`
- [ ] TypeScript: 0 errors

---

### Phase 6 — Cohere Integration Verification

**Test prompts:**
- "add task: fix login bug — note: reproduce on Chrome 122 with dev account" → `add_task(notes="reproduce on Chrome 122 with dev account")`
- "add a note to task 5: bring the signed contract" → `update_task(task_id=5, notes="bring the signed contract")`
- "clear the notes on task 3" → `update_task(task_id=3, notes="")`

---

### Phase 7 — Testing

| Test | Expected |
|------|----------|
| `POST /api/tasks {"notes":"remember this"}` | `notes` in response |
| `PUT /api/tasks/{id} {"notes":null}` | `notes: null` in response |
| `POST /api/tasks {"notes":"x"*5001}` | 422 |
| NL: "add note to task 5: call at 3pm" | AI calls `update_task(notes="call at 3pm")` |
| Task card with notes | FileText icon + collapsible section |
| Notes section expand/collapse | Toggle works; text displays with pre-wrap |
| TypeScript diagnostics | 0 errors |

---

## Risks & Mitigations

| Risk | Blast radius | Mitigation |
|------|-------------|------------|
| 5000-char limit not enforced on frontend | Oversized request → 422 | `maxLength={5000}` on `<Textarea>`; backend also validates |
| `notes=""` vs `notes=null` ambiguity in update | Notes not cleared | Tool: empty string → `None`; API: `null` in body clears field |
| Notes shown in task card inflate card height | Poor UX | Collapsed by default; only indicator (FileText icon) visible |
