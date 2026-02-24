"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { WeeklyPoint } from "@/types";

interface WeeklyChartProps {
  data: WeeklyPoint[];
}

function formatDay(dateStr: string): string {
  return new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(
    new Date(dateStr + "T12:00:00")
  );
}

export function WeeklyChart({ data }: WeeklyChartProps) {
  const chartData = data.map((d) => ({
    day: formatDay(d.date),
    completed: d.completed,
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <XAxis
          dataKey="day"
          tick={{ fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            borderRadius: "8px",
            fontSize: "12px",
            border: "1px solid #e2e8f0",
          }}
          cursor={{ fill: "rgba(79,70,229,0.08)" }}
        />
        <Bar dataKey="completed" fill="#4f46e5" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
