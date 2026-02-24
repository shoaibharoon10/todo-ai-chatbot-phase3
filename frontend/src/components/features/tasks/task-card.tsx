"use client";

import { Check, FileText, Pencil, Trash2, Undo2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TaskStatusBadge } from "./task-status-badge";
import { DueDateBadge } from "./due-date-badge";
import { RecurrenceBadge } from "./recurrence-badge";
import { PriorityBadge } from "./priority-badge";
import { TagChip } from "./tag-chip";
import { TaskNotesSection } from "./task-notes-section";
import type { Task } from "@/types";

interface TaskCardProps {
  task: Task;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function TaskCard({ task, onToggle, onEdit, onDelete }: TaskCardProps) {
  const priorityBorder = { urgent: "border-l-red-500", high: "border-l-orange-400", medium: "border-l-indigo-400", low: "border-l-blue-300" }[task.priority] ?? "border-l-indigo-400";
  return (
    <Card className={`group rounded-xl border border-l-4 border-slate-200 bg-white shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:shadow-none ${priorityBorder}`}>
      <CardContent className="p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between">
          <TaskStatusBadge completed={task.completed} />
          <div className="flex items-center gap-1.5">
            {task.notes && <FileText className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />}
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {new Date(task.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>

        <h3
          className={`text-lg font-semibold leading-tight ${
            task.completed
              ? "text-slate-400 line-through dark:text-slate-500"
              : "text-slate-900 dark:text-slate-50"
          }`}
        >
          <span className="line-clamp-2">{task.title}</span>
        </h3>

        {task.description && (
          <p className="mt-1 text-sm text-slate-500 line-clamp-3 dark:text-slate-400">
            {task.description}
          </p>
        )}

        {(task.due_date || task.recurrence_rule || (task.priority && task.priority !== "medium")) && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            <DueDateBadge dueDate={task.due_date} />
            <RecurrenceBadge recurrenceRule={task.recurrence_rule} />
            <PriorityBadge priority={task.priority} />
          </div>
        )}

        {task.tags && task.tags.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {task.tags.map((tag) => (
              <TagChip key={tag.id} tag={tag} />
            ))}
          </div>
        )}

        {task.notes && <TaskNotesSection notes={task.notes} />}

        <div className="mt-4 flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            aria-label={task.completed ? "Mark as pending" : "Mark as completed"}
            className="h-8 w-8 p-0 text-slate-400 hover:text-green-600 dark:hover:text-green-400"
          >
            {task.completed ? <Undo2 className="h-4 w-4" /> : <Check className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            aria-label="Edit task"
            className="h-8 w-8 p-0 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            aria-label="Delete task"
            className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 dark:hover:text-red-400"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
