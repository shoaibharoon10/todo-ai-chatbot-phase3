"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { getTasks, toggleTask, deleteTask as apiDeleteTask, createTask, updateTask } from "@/lib/api";
import { useTaskNotifications } from "@/hooks/use-task-notifications";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { cacheTasksForUser, getCachedTasksForUser } from "@/lib/task-cache";
import { enqueueAction, flushQueue, QueuedAction } from "@/lib/action-queue";
import { authClient } from "@/lib/auth-client";
import { TaskCard } from "./task-card";
import { TaskEmptyState } from "./task-empty-state";
import { TaskCreateDialog } from "./task-create-dialog";
import { TaskEditDialog } from "./task-edit-dialog";
import { TaskDeleteDialog } from "./task-delete-dialog";
import { TaskFilters } from "./task-filters";
import { TaskStats } from "./task-stats";
import type { Task, CreateTaskPayload, UpdateTaskPayload } from "@/types";

export function TaskList() {
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id ?? "";
  const online = useOnlineStatus();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("newest");
  const [overdue, setOverdue] = useState(false);
  const [priority, setPriority] = useState<string>("");
  const [selectedTag, setSelectedTag] = useState<number | null>(null);

  // Edit dialog state
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  // Delete dialog state
  const [deleteTaskTarget, setDeleteTaskTarget] = useState<Task | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const filters: { status?: string; sort?: string; overdue?: boolean; priority?: string; tag?: number } = {};
      if (status !== "all") filters.status = status;
      if (sort) filters.sort = sort;
      if (overdue) filters.overdue = true;
      if (priority) filters.priority = priority;
      if (selectedTag !== null) filters.tag = selectedTag;
      const data = await getTasks(filters);
      setTasks(data);
      setIsOffline(false);
      if (userId) await cacheTasksForUser(userId, data);
    } catch (err) {
      if (typeof navigator !== "undefined" && !navigator.onLine && userId) {
        const cached = await getCachedTasksForUser(userId);
        if (cached) {
          setTasks(cached);
          setIsOffline(true);
          return;
        }
      }
      const message = (err as { detail?: string })?.detail || "Failed to load tasks.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [status, sort, overdue, priority, selectedTag, userId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Execute a queued action against the live API
  const executeQueuedAction = useCallback(async (action: QueuedAction) => {
    switch (action.type) {
      case "create":
        await createTask(action.payload as CreateTaskPayload);
        break;
      case "update": {
        const { taskId, ...rest } = action.payload as { taskId: number } & UpdateTaskPayload;
        await updateTask(taskId, rest);
        break;
      }
      case "delete":
        await apiDeleteTask(action.payload as number);
        break;
      case "toggle":
        await toggleTask(action.payload as number);
        break;
    }
  }, []);

  // Flush write queue when coming back online
  useEffect(() => {
    if (!online || !userId) return;
    let cancelled = false;
    async function flush() {
      const result = await flushQueue(userId, executeQueuedAction);
      if (!cancelled && result && result.attempted > 0) {
        const synced = result.attempted - result.failed;
        toast.success(`Synced ${synced} change${synced !== 1 ? "s" : ""}`);
        if (result.failed > 0) toast.error(`${result.failed} change${result.failed !== 1 ? "s" : ""} failed to sync`);
        fetchTasks();
      }
    }
    flush();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online, userId]);

  function handleCreated(task: Task) {
    setTasks((prev) => [task, ...prev]);
  }

  function handleUpdated(updated: Task) {
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  }

  function handleDeleted(taskId: number) {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  }

  async function handleToggle(task: Task) {
    if (typeof navigator !== "undefined" && !navigator.onLine && userId) {
      await enqueueAction(userId, { type: "toggle", payload: task.id });
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, completed: !t.completed } : t))
      );
      toast.info("Saved offline — will sync when connected");
      return;
    }

    // Optimistic update
    const previousTasks = [...tasks];
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, completed: !t.completed } : t))
    );

    try {
      const updated = await toggleTask(task.id);
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      if (updated.completed && updated.next_occurrence) {
        setTasks((prev) => [...prev, updated.next_occurrence!]);
      }
      setTimeout(fetchTasks, 0);
      if (updated.completed && updated.next_occurrence) {
        const nextDate = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
          new Date(updated.next_occurrence.due_date ?? updated.next_occurrence.created_at)
        );
        toast.success(`Recurring task done — next due ${nextDate}`);
      } else {
        toast.success(updated.completed ? "Task completed" : "Task reopened");
      }
    } catch (err) {
      // Rollback
      setTasks(previousTasks);
      const message = (err as { detail?: string })?.detail || "Failed to toggle task.";
      toast.error(message);
    }
  }

  function openEdit(task: Task) {
    setEditTask(task);
    setEditOpen(true);
  }

  function openDelete(task: Task) {
    setDeleteTaskTarget(task);
    setDeleteOpen(true);
  }

  // T003 (006): Passive notification hook — fires browser notifications for due tasks
  useTaskNotifications(tasks);

  // Stats Calculation logic
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-[180px] animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Offline banner */}
      {isOffline && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
          Offline — showing cached data
        </div>
      )}

      {/* 1. Header Stats Section */}
      <TaskStats total={totalTasks} completed={completedTasks} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <TaskFilters
          status={status}
          sort={sort}
          overdue={overdue}
          priority={priority}
          tag={selectedTag}
          onStatusChange={setStatus}
          onSortChange={setSort}
          onOverdueChange={setOverdue}
          onPriorityChange={setPriority}
          onTagChange={setSelectedTag}
        />
        <TaskCreateDialog onCreated={handleCreated} />
      </div>

      {tasks.length === 0 ? (
        <TaskEmptyState onCreate={() => {}} />
      ) : (
        <div
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          aria-live="polite"
        >
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onToggle={() => handleToggle(task)}
              onEdit={() => openEdit(task)}
              onDelete={() => openDelete(task)}
            />
          ))}
        </div>
      )}

      <TaskEditDialog
        task={editTask}
        open={editOpen}
        onOpenChange={setEditOpen}
        onUpdated={handleUpdated}
      />

      <TaskDeleteDialog
        task={deleteTaskTarget}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onDeleted={handleDeleted}
      />
    </div>
  );
}
