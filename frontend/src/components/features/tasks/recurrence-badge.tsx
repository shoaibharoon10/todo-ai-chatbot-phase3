"use client";

import { Repeat } from "lucide-react";

interface RecurrenceBadgeProps {
  recurrenceRule: string | null | undefined;
}

const RULE_LABELS: Record<string, string> = {
  "FREQ=DAILY": "Daily",
  "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR": "Weekdays",
  "FREQ=WEEKLY": "Weekly",
  "FREQ=MONTHLY": "Monthly",
};

export function RecurrenceBadge({ recurrenceRule }: RecurrenceBadgeProps) {
  if (!recurrenceRule) return null;

  const label = RULE_LABELS[recurrenceRule] ?? "Recurring";

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
      <Repeat className="h-3 w-3" />
      {label}
    </span>
  );
}
