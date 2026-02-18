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
import type { Task } from "@/types";

interface TaskCreateDialogProps {
  onCreated: (task: Task) => void;
}

export function TaskCreateDialog({ onCreated }: TaskCreateDialogProps) {
  const [open, setOpen] = useState(false);
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
    try {
      const task = await createTask({
        title: data.title,
        description: data.description || undefined,
      });
      onCreated(task);
      toast.success("Task created");
      reset();
      setOpen(false);
    } catch (err) {
      const message = (err as { detail?: string })?.detail || "Failed to create task.";
      toast.error(message);
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
