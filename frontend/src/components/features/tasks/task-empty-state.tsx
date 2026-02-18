import { ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TaskEmptyStateProps {
  onCreate: () => void;
}

export function TaskEmptyState({ onCreate }: TaskEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 px-4 py-16 text-center dark:border-slate-700">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-500/10">
        <ClipboardList className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-50">
        No tasks yet
      </h3>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Start your day with a new task!
      </p>
      <Button onClick={onCreate} className="mt-6">
        Create your first task
      </Button>
    </div>
  );
}
