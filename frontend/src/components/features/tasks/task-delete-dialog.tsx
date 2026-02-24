"use client";

import { useState } from "react";
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
import { deleteTask } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { enqueueAction } from "@/lib/action-queue";
import type { Task } from "@/types";

interface TaskDeleteDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: (taskId: number) => void;
}

export function TaskDeleteDialog({ task, open, onOpenChange, onDeleted }: TaskDeleteDialogProps) {
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id ?? "";
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!task) return;
    setIsDeleting(true);
    try {
      await deleteTask(task.id);
      onDeleted(task.id);
      toast.success("Task deleted");
      onOpenChange(false);
    } catch {
      if (typeof navigator !== "undefined" && !navigator.onLine && userId) {
        await enqueueAction(userId, { type: "delete", payload: task.id });
        onDeleted(task.id);
        toast.info("Queued for deletion — will sync when connected");
        onOpenChange(false);
        return;
      }
      toast.error("Failed to delete task.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] dark:border-slate-700 dark:bg-slate-900">
        <DialogHeader>
          <DialogTitle className="dark:text-slate-50">Delete task</DialogTitle>
          <DialogDescription className="dark:text-slate-400">
            Are you sure you want to delete{" "}
            <span className="font-medium text-slate-900 dark:text-slate-200">
              &ldquo;{task?.title}&rdquo;
            </span>
            ? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="dark:border-slate-700 dark:text-slate-300"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
