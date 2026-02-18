"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TaskFiltersProps {
  status: string;
  sort: string;
  onStatusChange: (status: string) => void;
  onSortChange: (sort: string) => void;
}

export function TaskFilters({ status, sort, onStatusChange, onSortChange }: TaskFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
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
        </SelectContent>
      </Select>
    </div>
  );
}
