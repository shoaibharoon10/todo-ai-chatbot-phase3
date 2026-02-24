import { Card, CardContent } from "@/components/ui/card";

interface StatsCardProps {
  label: string;
  value: number | string;
  suffix?: string;
  colorClass?: string;
}

export function StatsCard({ label, value, suffix, colorClass = "text-slate-900 dark:text-slate-50" }: StatsCardProps) {
  return (
    <Card className="rounded-xl dark:border-slate-700 dark:bg-slate-900">
      <CardContent className="p-4">
        <p className={`text-3xl font-bold tabular-nums ${colorClass}`}>
          {value}
          {suffix && <span className="ml-1 text-xl font-semibold">{suffix}</span>}
        </p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{label}</p>
      </CardContent>
    </Card>
  );
}
