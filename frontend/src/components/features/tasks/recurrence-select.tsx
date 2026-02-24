"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface RecurrenceSelectProps {
  value: string | null;
  onChange: (v: string | null) => void;
}

const RECURRENCE_OPTIONS = [
  { label: "None", value: "none" },
  { label: "Daily", value: "FREQ=DAILY" },
  { label: "Weekdays", value: "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR" },
  { label: "Weekly", value: "FREQ=WEEKLY" },
  { label: "Monthly", value: "FREQ=MONTHLY" },
] as const;

export function RecurrenceSelect({ value, onChange }: RecurrenceSelectProps) {
  return (
    <Select
      value={value ?? "none"}
      onValueChange={(v) => onChange(v === "none" ? null : v)}
    >
      <SelectTrigger className="w-full dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50">
        <SelectValue placeholder="No recurrence" />
      </SelectTrigger>
      <SelectContent className="dark:border-slate-700 dark:bg-slate-900">
        {RECURRENCE_OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
