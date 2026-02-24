"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createTaskSchema, type CreateTaskFormData } from "@/lib/validations";
import { createTask } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { enqueueAction } from "@/lib/action-queue";
import { RecurrenceSelect } from "./recurrence-select";
import { PrioritySelect } from "./priority-select";
import { TagMultiSelect } from "./tag-multi-select";
import type { Task } from "@/types";

interface TaskCreateDialogProps {
  onCreated: (task: Task) => void;
}

export function TaskCreateDialog({ onCreated }: TaskCreateDialogProps) {
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id ?? "";

  const [open, setOpen] = useState(false);
  const [dueDate, setDueDate] = useState<string>("");
  const [recurrenceRule, setRecurrenceRule] = useState<string | null>(null);
  const [priority, setPriority] = useState<string>("medium");
  const [tagIds, setTagIds] = useState<number[]>([]);
  const [notes, setNotes] = useState<string>("");
  const [showNotes, setShowNotes] = useState(false);
  const [reminderOffset, setReminderOffset] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateTaskFormData>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: { title: "", description: "" },
  });

  async function onSubmit(data: CreateTaskFormData) {
    const dueDateIso = dueDate ? new Date(dueDate + "T00:00:00").toISOString() : null;
    const payload = {
      title: data.title,
      description: data.description || undefined,
      due_date: dueDateIso,
      recurrence_rule: recurrenceRule,
      priority: priority as "low" | "medium" | "high" | "urgent",
      tag_ids: tagIds,
      notes: showNotes ? notes || null : null,
      reminder_offset_minutes: dueDateIso ? reminderOffset : null,
    };
    try {
      const task = await createTask(payload);
      onCreated(task);
      toast.success("Task created");
      reset();
      setDueDate("");
      setRecurrenceRule(null);
      setPriority("medium");
      setTagIds([]);
      setNotes("");
      setShowNotes(false);
      setReminderOffset(null);
      setOpen(false);
    } catch {
      if (typeof navigator !== "undefined" && !navigator.onLine && userId) {
        await enqueueAction(userId, { type: "create", payload });
        toast.info("Saved offline — will sync when connected");
        reset();
        setDueDate("");
        setRecurrenceRule(null);
        setPriority("medium");
        setTagIds([]);
        setNotes("");
        setShowNotes(false);
        setReminderOffset(null);
        setOpen(false);
        return;
      }
      toast.error("Failed to create task.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Task
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] dark:border-slate-700 dark:bg-slate-900">
        <DialogHeader>
          <DialogTitle className="dark:text-slate-50">Create a new task</DialogTitle>
          <DialogDescription className="dark:text-slate-400">
            Add a title and optional description for your task.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="dark:text-slate-200">Title</Label>
            <Input
              id="title"
              placeholder="What needs to be done?"
              {...register("title")}
              className="dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description" className="dark:text-slate-200">
              Description <span className="text-slate-400">(optional)</span>
            </Label>
            <Textarea
              id="description"
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
            <Label htmlFor="due-date" className="dark:text-slate-200">
              Due Date <span className="text-slate-400">(optional)</span>
            </Label>
            <input
              id="due-date"
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
          <div>
            {!showNotes ? (
              <button
                type="button"
                onClick={() => setShowNotes(true)}
                className="text-xs text-indigo-600 hover:underline dark:text-indigo-400"
              >
                + Add Notes
              </button>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="dark:text-slate-200">Notes</Label>
                  <button
                    type="button"
                    onClick={() => { setShowNotes(false); setNotes(""); }}
                    className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    Remove Notes
                  </button>
                </div>
                <Textarea
                  placeholder="Add notes..."
                  maxLength={5000}
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="dark:border-slate-700 dark:text-slate-300"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
