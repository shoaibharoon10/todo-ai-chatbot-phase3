"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PrioritySelectProps {
  value: string;
  onChange: (v: string) => void;
}

export function PrioritySelect({ value, onChange }: PrioritySelectProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50">
        <SelectValue placeholder="Priority" />
      </SelectTrigger>
      <SelectContent className="dark:border-slate-700 dark:bg-slate-900">
        <SelectItem value="low">Low</SelectItem>
        <SelectItem value="medium">Medium</SelectItem>
        <SelectItem value="high">High</SelectItem>
        <SelectItem value="urgent">Urgent</SelectItem>
      </SelectContent>
    </Select>
  );
}
