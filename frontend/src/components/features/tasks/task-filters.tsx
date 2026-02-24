"use client";

import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { getTags } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import type { Tag } from "@/types";

interface TaskFiltersProps {
  status: string;
  sort: string;
  overdue: boolean;
  priority: string;
  tag: number | null;
  onStatusChange: (status: string) => void;
  onSortChange: (sort: string) => void;
  onOverdueChange: (overdue: boolean) => void;
  onPriorityChange: (priority: string) => void;
  onTagChange: (tag: number | null) => void;
}

export function TaskFilters({
  status,
  sort,
  overdue,
  priority,
  tag,
  onStatusChange,
  onSortChange,
  onOverdueChange,
  onPriorityChange,
  onTagChange,
}: TaskFiltersProps) {
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id ?? "";
  const [tags, setTags] = useState<Tag[]>([]);

  useEffect(() => {
    if (!userId) return;
    getTags(userId)
      .then(setTags)
      .catch(() => {});
  }, [userId]);

  return (
    <div className="flex flex-wrap gap-3">
      <Select value={status} onValueChange={onStatusChange}>
        <SelectTrigger className="w-full sm:w-[160px] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50">
          <SelectValue placeholder="Filter by status" />
        </SelectTrigger>
        <SelectContent className="dark:border-slate-700 dark:bg-slate-900">
          <SelectItem value="all">All tasks</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
        </SelectContent>
      </Select>

      <Select value={sort} onValueChange={onSortChange}>
        <SelectTrigger className="w-full sm:w-[160px] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent className="dark:border-slate-700 dark:bg-slate-900">
          <SelectItem value="newest">Newest first</SelectItem>
          <SelectItem value="oldest">Oldest first</SelectItem>
          <SelectItem value="priority">By priority</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={priority || "all"}
        onValueChange={(v) => onPriorityChange(v === "all" ? "" : v)}
      >
        <SelectTrigger className="w-full sm:w-[160px] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50">
          <SelectValue placeholder="All priorities" />
        </SelectTrigger>
        <SelectContent className="dark:border-slate-700 dark:bg-slate-900">
          <SelectItem value="all">All priorities</SelectItem>
          <SelectItem value="low">Low</SelectItem>
          <SelectItem value="medium">Medium</SelectItem>
          <SelectItem value="high">High</SelectItem>
          <SelectItem value="urgent">Urgent</SelectItem>
        </SelectContent>
      </Select>

      {tags.length > 0 && (
        <Select
          value={tag !== null ? String(tag) : "all"}
          onValueChange={(v) => onTagChange(v === "all" ? null : Number(v))}
        >
          <SelectTrigger className="w-full sm:w-[160px] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50">
            <SelectValue placeholder="All tags" />
          </SelectTrigger>
          <SelectContent className="dark:border-slate-700 dark:bg-slate-900">
            <SelectItem value="all">All tags</SelectItem>
            {tags.map((t) => (
              <SelectItem key={t.id} value={String(t.id)}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <Button
        variant={overdue ? "default" : "outline"}
        size="sm"
        onClick={() => onOverdueChange(!overdue)}
        className={
          overdue
            ? "gap-1.5 bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700"
            : "gap-1.5 dark:border-slate-700 dark:text-slate-300"
        }
      >
        <AlertCircle className="h-3.5 w-3.5" />
        Overdue
      </Button>
    </div>
  );
}
