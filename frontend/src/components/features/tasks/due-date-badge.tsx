"use client";

import { CalendarDays } from "lucide-react";

interface DueDateBadgeProps {
  dueDate: string | null | undefined;
}

export function DueDateBadge({ dueDate }: DueDateBadgeProps) {
  if (!dueDate) return null;

  const due = new Date(dueDate);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());

  let colorClass: string;
  if (dueDay < today) {
    colorClass = "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
  } else if (dueDay.getTime() === today.getTime()) {
    colorClass = "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
  } else {
    colorClass = "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
  }

  const formatted = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(due);

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${colorClass}`}
    >
      <CalendarDays className="h-3 w-3" />
      {formatted}
    </span>
  );
}
