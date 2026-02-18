import { TaskSkeleton } from "@/components/features/tasks/task-skeleton";

export default function TasksLoading() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="h-8 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        <div className="mt-2 h-4 w-48 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <TaskSkeleton key={i} />
        ))}
      </div>
    </main>
  );
}
