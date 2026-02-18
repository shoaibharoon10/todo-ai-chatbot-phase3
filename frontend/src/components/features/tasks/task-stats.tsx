"use client";

import { CheckCircle2, Circle, ListTodo } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress"; // Ensure you have shadcn progress component

interface TaskStatsProps {
  total: number;
  completed: number;
}

export function TaskStats({ total, completed }: TaskStatsProps) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <Card className="mb-8 overflow-hidden border-none bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-lg">
      <CardContent className="p-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">Daily Overview</h2>
            <p className="text-indigo-100/80">
              You have {total - completed} pending tasks for today.
            </p>
          </div>

          <div className="flex gap-4">
            <div className="flex flex-col items-center rounded-xl bg-white/10 p-3 backdrop-blur-md">
              <ListTodo className="mb-1 h-5 w-5 text-indigo-200" />
              <span className="text-xl font-bold">{total}</span>
              <span className="text-[10px] uppercase tracking-wider text-indigo-200">Total</span>
            </div>
            <div className="flex flex-col items-center rounded-xl bg-white/10 p-3 backdrop-blur-md">
              <CheckCircle2 className="mb-1 h-5 w-5 text-green-300" />
              <span className="text-xl font-bold">{completed}</span>
              <span className="text-[10px] uppercase tracking-wider text-indigo-200">Done</span>
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-2">
          <div className="flex items-center justify-between text-sm font-medium">
            <span>Progress</span>
            <span>{percentage}% Complete</span>
          </div>
          <Progress value={percentage} className="h-2 bg-white/20" />
        </div>
      </CardContent>
    </Card>
  );
}