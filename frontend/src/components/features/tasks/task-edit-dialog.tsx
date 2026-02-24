"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { editTaskSchema, type EditTaskFormData } from "@/lib/validations";
import { updateTask } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { enqueueAction } from "@/lib/action-queue";
import { RecurrenceSelect } from "./recurrence-select";
import { PrioritySelect } from "./priority-select";
import { TagMultiSelect } from "./tag-multi-select";
import type { Task } from "@/types";

interface TaskEditDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: (task: Task) => void;
}

export function TaskEditDialog({ task, open, onOpenChange, onUpdated }: TaskEditDialogProps) {
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id ?? "";

  const [dueDate, setDueDate] = useState<string>("");
  const [recurrenceRule, setRecurrenceRule] = useState<string | null>(null);
  const [priority, setPriority] = useState<string>("medium");
  const [tagIds, setTagIds] = useState<number[]>([]);
  const [notes, setNotes] = useState<string | null>(null);
  const [reminderOffset, setReminderOffset] = useState<number | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditTaskFormData>({
    resolver: zodResolver(editTaskSchema),
  });

  useEffect(() => {
    if (task && open) {
      reset({
        title: task.title,
        description: task.description ?? "",
      });
      setDueDate(
        task.due_date ? new Date(task.due_date).toISOString().split("T")[0] : ""
      );
      setRecurrenceRule(task.recurrence_rule ?? null);
      setPriority(task.priority ?? "medium");
      setTagIds(task.tags?.map((t) => t.id) ?? []);
      setNotes(task.notes ?? null);
      setReminderOffset(task.reminder_offset_minutes ?? null);
    }
  }, [task, open, reset]);

  async function onSubmit(data: EditTaskFormData) {
    if (!task) return;
    const dueDateIso = dueDate ? new Date(dueDate + "T00:00:00").toISOString() : null;
    const payload = {
      title: data.title,
      description: data.description || null,
      due_date: dueDateIso,
      recurrence_rule: recurrenceRule,
      priority: priority as "low" | "medium" | "high" | "urgent",
      tag_ids: tagIds,
      notes: notes || null,
      reminder_offset_minutes: dueDateIso ? reminderOffset : null,
    };
    try {
      const updated = await updateTask(task.id, payload);
      onUpdated(updated);
      toast.success("Task updated");
      onOpenChange(false);
    } catch {
      if (typeof navigator !== "undefined" && !navigator.onLine && userId) {
        await enqueueAction(userId, { type: "update", payload: { taskId: task.id, ...payload } });
        toast.info("Saved offline — will sync when connected");
        onOpenChange(false);
        return;
      }
      toast.error("Failed to update task.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] dark:border-slate-700 dark:bg-slate-900">
        <DialogHeader>
          <DialogTitle className="dark:text-slate-50">Edit task</DialogTitle>
          <DialogDescription className="dark:text-slate-400">
            Update the title or description of your task.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title" className="dark:text-slate-200">Title</Label>
            <Input
              id="edit-title"
              placeholder="Task title"
              {...register("title")}
              className="dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-description" className="dark:text-slate-200">
              Description <span className="text-slate-400">(optional)</span>
            </Label>
            <Textarea
              id="edit-description"
              placeholder="Add more details..."
              rows={3}
              {...register("description")}
              className="dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-due-date" className="dark:text-slate-200">
              Due Date <span className="text-slate-400">(optional)</span>
            </Label>
            <input
              id="edit-due-date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50 dark:focus-visible:ring-slate-300"
            />
          </div>
          {dueDate && (
            <div className="space-y-2">
              <Label className="dark:text-slate-200">
                Reminder <span className="text-slate-400">(optional)</span>
              </Label>
              <select
                value={reminderOffset ?? ""}
                onChange={(e) => setReminderOffset(e.target.value ? Number(e.target.value) : null)}
                className="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50 dark:focus-visible:ring-slate-300"
              >
                <option value="">No reminder</option>
                <option value="15">15 min before</option>
                <option value="30">30 min before</option>
                <option value="60">1 hour before</option>
                <option value="120">2 hours before</option>
                <option value="1440">1 day before</option>
              </select>
            </div>
          )}
          <div className="space-y-2">
            <Label className="dark:text-slate-200">
              Recurrence <span className="text-slate-400">(optional)</span>
            </Label>
            <RecurrenceSelect value={recurrenceRule} onChange={setRecurrenceRule} />
          </div>
          <div className="space-y-2">
            <Label className="dark:text-slate-200">Priority</Label>
            <PrioritySelect value={priority} onChange={setPriority} />
          </div>
          <div className="space-y-2">
            <Label className="dark:text-slate-200">
              Tags <span className="text-slate-400">(optional)</span>
            </Label>
            <TagMultiSelect selectedIds={tagIds} onChange={setTagIds} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-notes" className="dark:text-slate-200">
              Notes <span className="text-slate-400">(optional)</span>
            </Label>
            <Textarea
              id="edit-notes"
              placeholder="Add notes..."
              maxLength={5000}
              rows={3}
              value={notes ?? ""}
              onChange={(e) => setNotes(e.target.value || null)}
              className="dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="dark:border-slate-700 dark:text-slate-300"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
