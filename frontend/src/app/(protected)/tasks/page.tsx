"use client";

import { authClient } from "@/lib/auth-client";
import { TaskList } from "@/components/features/tasks/task-list";
import { FloatingChat } from "@/components/features/chat/floating-chat";

export default function TasksPage() {
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;
  const userName = session?.user?.name ?? undefined;
  const userEmail = session?.user?.email ?? undefined;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-3xl">
          Welcome Back,
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Organize and track your daily tasks
        </p>
      </div>
      <TaskList />
      {userId && (
        <FloatingChat userId={userId} userName={userName} userEmail={userEmail} />
      )}
    </main>
  );
}
