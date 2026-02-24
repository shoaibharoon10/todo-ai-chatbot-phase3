"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { getStats } from "@/lib/api";
import { StatsCard } from "@/components/features/dashboard/stats-card";
import { WeeklyChart } from "@/components/features/dashboard/weekly-chart";
import type { StatsResponse } from "@/types";

export default function DashboardPage() {
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id ?? "";
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    getStats(userId)
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex gap-1.5">
          <span className="h-2 w-2 animate-bounce rounded-full bg-indigo-500 [animation-delay:-0.3s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-indigo-500 [animation-delay:-0.15s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-indigo-500" />
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-500">
        Could not load stats. Please try again.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
          Progress Dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Your task productivity at a glance
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatsCard label="Total Tasks" value={stats.total} />
        <StatsCard
          label="Completed"
          value={stats.completed}
          colorClass="text-green-600 dark:text-green-400"
        />
        <StatsCard
          label="Pending"
          value={stats.pending}
          colorClass="text-blue-600 dark:text-blue-400"
        />
        <StatsCard
          label="Overdue"
          value={stats.overdue}
          colorClass="text-red-600 dark:text-red-400"
        />
      </div>

      {/* Completion rate card */}
      <StatsCard
        label="Completion Rate"
        value={stats.completion_rate}
        suffix="%"
        colorClass="text-indigo-600 dark:text-indigo-400"
      />

      {/* Weekly chart */}
      <div className="rounded-xl border bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
        <h2 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
          Tasks Completed — Last 7 Days
        </h2>
        <WeeklyChart data={stats.weekly} />
      </div>
    </div>
  );
}
