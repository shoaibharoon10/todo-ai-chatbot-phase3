import { Badge } from "@/components/ui/badge";

const BADGE_CONFIG: Record<string, { className: string; label: string }> = {
  pending: {
    className: "bg-yellow-50 text-yellow-700 ring-1 ring-yellow-600/20 dark:bg-yellow-500/10 dark:text-yellow-400 dark:ring-yellow-500/30",
    label: "Pending",
  },
  completed: {
    className: "bg-green-50 text-green-700 ring-1 ring-green-600/20 dark:bg-green-500/10 dark:text-green-400 dark:ring-green-500/30",
    label: "Completed",
  },
};

export function TaskStatusBadge({ completed }: { completed: boolean }) {
  const status = completed ? "completed" : "pending";
  const config = BADGE_CONFIG[status];

  return (
    <Badge
      variant="outline"
      className={`rounded-full border-0 text-xs font-medium ${config.className}`}
      role="status"
    >
      {config.label}
    </Badge>
  );
}
