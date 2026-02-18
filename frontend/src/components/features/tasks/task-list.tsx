"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { getTasks, toggleTask, deleteTask as apiDeleteTask } from "@/lib/api";
import { TaskCard } from "./task-card";
import { TaskEmptyState } from "./task-empty-state";
import { TaskCreateDialog } from "./task-create-dialog";
import { TaskEditDialog } from "./task-edit-dialog";
import { TaskDeleteDialog } from "./task-delete-dialog";
import { TaskFilters } from "./task-filters";
import { TaskStats } from "./task-stats"; // Naya component import kiya
import type { Task } from "@/types";

export function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("newest");

  // Edit dialog state
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  // Delete dialog state
  const [deleteTaskTarget, setDeleteTaskTarget] = useState<Task | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const filters: { status?: string; sort?: string } = {};
      if (status !== "all") filters.status = status;
      if (sort) filters.sort = sort;
      const data = await getTasks(filters);
      setTasks(data);
    } catch (err) {
      const message = (err as { detail?: string })?.detail || "Failed to load tasks.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [status, sort]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

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
    // Optimistic update
    const previousTasks = [...tasks];
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, completed: !t.completed } : t))
    );

    try {
      const updated = await toggleTask(task.id);
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      toast.success(updated.completed ? "Task completed" : "Task reopened");
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

  // Stats Calculation logic yahan hai
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
      {/* 1. Header Stats Section - Ab ye sab se upar dikhay ga */}
      <TaskStats total={totalTasks} completed={completedTasks} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <TaskFilters
          status={status}
          sort={sort}
          onStatusChange={setStatus}
          onSortChange={setSort}
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