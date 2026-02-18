---
name: Responsive Task UI
description: Implement responsive UI for tasks.
trigger: build task ui
---

# Responsive Task UI Skill

## Purpose

Build a fully responsive task management interface using Next.js, Tailwind CSS, and the centralized API client. The UI includes a task list with status badges, create/update forms, delete confirmation, and adapts seamlessly from mobile (single column) to desktop (grid layout).

## Instructions

When triggered, execute the following steps in order:

### Step 1: Component Structure

Create the following files:

```
components/
├── features/
│   └── tasks/
│       ├── TaskList.tsx          # Main task list with grid layout
│       ├── TaskCard.tsx          # Individual task card
│       ├── TaskCreateForm.tsx    # Create new task form
│       ├── TaskEditForm.tsx      # Edit existing task form
│       ├── TaskStatusBadge.tsx   # Status indicator badge
│       ├── TaskEmptyState.tsx    # Empty state placeholder
│       └── TaskDeleteDialog.tsx  # Delete confirmation modal
├── ui/
│   ├── Button.tsx                # Reusable button
│   ├── Input.tsx                 # Reusable input field
│   ├── Modal.tsx                 # Reusable modal/dialog
│   └── Spinner.tsx               # Loading spinner
```

### Step 2: TaskList Component

`components/features/tasks/TaskList.tsx`

```typescript
"use client";

import { getTasks, deleteTask, type Task } from "@/lib/api";
import { useEffect, useState } from "react";
import { TaskCard } from "./TaskCard";
import { TaskCreateForm } from "./TaskCreateForm";
import { TaskEditForm } from "./TaskEditForm";
import { TaskEmptyState } from "./TaskEmptyState";
import { Spinner } from "@/components/ui/Spinner";

export function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  async function fetchTasks() {
    try {
      setLoading(true);
      const data = await getTasks();
      setTasks(data);
      setError(null);
    } catch (err: any) {
      setError(err.detail || "Failed to load tasks.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTasks();
  }, []);

  async function handleDelete(id: string) {
    await deleteTask(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  function handleCreated(task: Task) {
    setTasks((prev) => [task, ...prev]);
    setShowCreateForm(false);
  }

  function handleUpdated(updated: Task) {
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    setEditingTask(null);
  }

  // --- Loading state ---
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner />
      </div>
    );
  }

  // --- Error state ---
  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center text-red-700">
        <p>{error}</p>
        <button
          onClick={fetchTasks}
          className="mt-2 text-sm font-medium text-red-600 underline hover:text-red-800"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          + New Task
        </button>
      </div>

      {/* Create form */}
      {showCreateForm && (
        <TaskCreateForm
          onCreated={handleCreated}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {/* Edit form */}
      {editingTask && (
        <TaskEditForm
          task={editingTask}
          onUpdated={handleUpdated}
          onCancel={() => setEditingTask(null)}
        />
      )}

      {/* Task grid */}
      {tasks.length === 0 ? (
        <TaskEmptyState onCreate={() => setShowCreateForm(true)} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={() => setEditingTask(task)}
              onDelete={() => handleDelete(task.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

### Step 3: TaskCard Component

`components/features/tasks/TaskCard.tsx`

```typescript
"use client";

import { type Task } from "@/lib/api";
import { TaskStatusBadge } from "./TaskStatusBadge";
import { TaskDeleteDialog } from "./TaskDeleteDialog";
import { useState } from "react";

interface TaskCardProps {
  task: Task;
  onEdit: () => void;
  onDelete: () => void;
}

export function TaskCard({ task, onEdit, onDelete }: TaskCardProps) {
  const [showDelete, setShowDelete] = useState(false);

  return (
    <>
      <div className="group relative rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
        {/* Status badge */}
        <div className="mb-3">
          <TaskStatusBadge status={task.status} />
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
          {task.title}
        </h3>

        {/* Description */}
        {task.description && (
          <p className="mt-1 text-sm text-gray-500 line-clamp-3">
            {task.description}
          </p>
        )}

        {/* Timestamp */}
        <p className="mt-3 text-xs text-gray-400">
          {new Date(task.created_at).toLocaleDateString()}
        </p>

        {/* Actions */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={onEdit}
            className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
          >
            Edit
          </button>
          <button
            onClick={() => setShowDelete(true)}
            className="flex-1 rounded-md border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Delete confirmation */}
      {showDelete && (
        <TaskDeleteDialog
          taskTitle={task.title}
          onConfirm={() => {
            onDelete();
            setShowDelete(false);
          }}
          onCancel={() => setShowDelete(false)}
        />
      )}
    </>
  );
}
```

### Step 4: TaskCreateForm Component

`components/features/tasks/TaskCreateForm.tsx`

```typescript
"use client";

import { createTask, type Task } from "@/lib/api";
import { useState } from "react";

interface TaskCreateFormProps {
  onCreated: (task: Task) => void;
  onCancel: () => void;
}

export function TaskCreateForm({ onCreated, onCancel }: TaskCreateFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setSubmitting(true);
      setError(null);
      const task = await createTask({
        title: title.trim(),
        description: description.trim() || undefined,
      });
      onCreated(task);
    } catch (err: any) {
      setError(err.detail || "Failed to create task.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-4"
    >
      <h2 className="text-lg font-semibold text-gray-900">Create Task</h2>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          type="text"
          required
          maxLength={255}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs to be done?"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          id="description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add details (optional)"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting || !title.trim()}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Creating..." : "Create Task"}
        </button>
      </div>
    </form>
  );
}
```

### Step 5: TaskEditForm Component

`components/features/tasks/TaskEditForm.tsx`

```typescript
"use client";

import { updateTask, type Task, type UpdateTaskPayload } from "@/lib/api";
import { useState } from "react";

interface TaskEditFormProps {
  task: Task;
  onUpdated: (task: Task) => void;
  onCancel: () => void;
}

export function TaskEditForm({ task, onUpdated, onCancel }: TaskEditFormProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [status, setStatus] = useState(task.status);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setSubmitting(true);
      setError(null);
      const payload: UpdateTaskPayload = {
        title: title.trim(),
        description: description.trim() || undefined,
        status,
      };
      const updated = await updateTask(task.id, payload);
      onUpdated(updated);
    } catch (err: any) {
      setError(err.detail || "Failed to update task.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 space-y-4"
    >
      <h2 className="text-lg font-semibold text-gray-900">Edit Task</h2>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div>
        <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          id="edit-title"
          type="text"
          required
          maxLength={255}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          id="edit-description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="edit-status" className="block text-sm font-medium text-gray-700">
          Status
        </label>
        <select
          id="edit-status"
          value={status}
          onChange={(e) => setStatus(e.target.value as Task["status"])}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting || !title.trim()}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
```

### Step 6: Supporting Components

#### TaskStatusBadge

`components/features/tasks/TaskStatusBadge.tsx`

```typescript
import { type Task } from "@/lib/api";

const BADGE_STYLES: Record<Task["status"], string> = {
  pending:
    "bg-gray-100 text-gray-700 ring-gray-300",
  in_progress:
    "bg-blue-100 text-blue-700 ring-blue-300",
  completed:
    "bg-green-100 text-green-700 ring-green-300",
};

const BADGE_LABELS: Record<Task["status"], string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
};

export function TaskStatusBadge({ status }: { status: Task["status"] }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${BADGE_STYLES[status]}`}
    >
      {BADGE_LABELS[status]}
    </span>
  );
}
```

#### TaskEmptyState

`components/features/tasks/TaskEmptyState.tsx`

```typescript
interface TaskEmptyStateProps {
  onCreate: () => void;
}

export function TaskEmptyState({ onCreate }: TaskEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 py-16 px-4 text-center">
      <p className="text-lg font-medium text-gray-500">No tasks yet</p>
      <p className="mt-1 text-sm text-gray-400">
        Create your first task to get started.
      </p>
      <button
        onClick={onCreate}
        className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        + Create Task
      </button>
    </div>
  );
}
```

#### TaskDeleteDialog

`components/features/tasks/TaskDeleteDialog.tsx`

```typescript
"use client";

interface TaskDeleteDialogProps {
  taskTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function TaskDeleteDialog({ taskTitle, onConfirm, onCancel }: TaskDeleteDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900">Delete Task</h3>
        <p className="mt-2 text-sm text-gray-500">
          Are you sure you want to delete{" "}
          <span className="font-medium text-gray-700">"{taskTitle}"</span>?
          This action cannot be undone.
        </p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            onClick={onCancel}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
```

#### Spinner

`components/ui/Spinner.tsx`

```typescript
export function Spinner() {
  return (
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
  );
}
```

### Step 7: Page Integration

`app/dashboard/page.tsx`

```typescript
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { TaskList } from "@/components/features/tasks/TaskList";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <TaskList />
    </main>
  );
}
```

## Responsive Breakpoints

| Breakpoint | Layout | Behavior |
|---|---|---|
| `< 640px` (mobile) | Single column | Cards stack vertically, buttons full-width, form inputs full-width |
| `640px – 1023px` (tablet) | 2-column grid | Cards in 2-col grid, action buttons side-by-side |
| `>= 1024px` (desktop) | 3-column grid | Cards in 3-col grid, max-width container centered |

Key Tailwind classes used:

```
grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3   → responsive grid
flex flex-col-reverse sm:flex-row                  → mobile-first button order
px-4 sm:px-6 lg:px-8                              → responsive padding
max-w-6xl mx-auto                                 → centered container
```

## File Output

| File | Action | Description |
|---|---|---|
| `components/features/tasks/TaskList.tsx` | Created | Main list with fetch, state management, grid layout |
| `components/features/tasks/TaskCard.tsx` | Created | Individual card with edit/delete actions |
| `components/features/tasks/TaskCreateForm.tsx` | Created | Create form with validation |
| `components/features/tasks/TaskEditForm.tsx` | Created | Edit form with status selector |
| `components/features/tasks/TaskStatusBadge.tsx` | Created | Color-coded status badge |
| `components/features/tasks/TaskEmptyState.tsx` | Created | Empty state with CTA |
| `components/features/tasks/TaskDeleteDialog.tsx` | Created | Delete confirmation modal |
| `components/ui/Spinner.tsx` | Created | Loading spinner |
| `app/dashboard/page.tsx` | Created | Protected dashboard page |

## Validation Checklist

- [ ] `TaskList` fetches tasks via `getTasks()` from `lib/api`
- [ ] Grid is responsive: 1 col mobile, 2 col tablet, 3 col desktop
- [ ] `TaskCreateForm` calls `createTask()` and updates the list on success
- [ ] `TaskEditForm` supports title, description, and status changes
- [ ] `TaskDeleteDialog` requires confirmation before calling `deleteTask()`
- [ ] `TaskStatusBadge` renders correct color per status (gray/blue/green)
- [ ] Empty state shows when no tasks exist with a CTA to create
- [ ] Loading spinner displays while fetching
- [ ] Error state shows with retry option
- [ ] All form buttons stack vertically on mobile, row on desktop
- [ ] Dashboard page redirects unauthenticated users to `/login`
