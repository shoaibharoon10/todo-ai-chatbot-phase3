"use client";

import { useEffect } from "react";
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
import type { Task } from "@/types";

interface TaskEditDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: (task: Task) => void;
}

export function TaskEditDialog({ task, open, onOpenChange, onUpdated }: TaskEditDialogProps) {
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
    }
  }, [task, open, reset]);

  async function onSubmit(data: EditTaskFormData) {
    if (!task) return;
    try {
      const updated = await updateTask(task.id, {
        title: data.title,
        description: data.description || null,
      });
      onUpdated(updated);
      toast.success("Task updated");
      onOpenChange(false);
    } catch (err) {
      const message = (err as { detail?: string })?.detail || "Failed to update task.";
      toast.error(message);
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
