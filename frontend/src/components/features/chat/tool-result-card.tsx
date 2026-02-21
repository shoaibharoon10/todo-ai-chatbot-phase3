"use client";

import { Badge } from "@/components/ui/badge";
import type { ToolCallResult } from "@/types";

interface ToolResultCardProps {
  toolCall: ToolCallResult;
}

function formatResult(result: unknown): string {
  if (result === null || result === undefined) return "Done";
  if (typeof result === "object" && "error" in (result as Record<string, unknown>)) {
    return String((result as Record<string, unknown>).error);
  }
  if (Array.isArray(result)) {
    return `${result.length} task${result.length !== 1 ? "s" : ""} found`;
  }
  if (typeof result === "object" && "title" in (result as Record<string, unknown>)) {
    const r = result as Record<string, unknown>;
    return `${r.title}${r.completed ? " (completed)" : ""}`;
  }
  if (typeof result === "object" && "deleted" in (result as Record<string, unknown>)) {
    return "Deleted successfully";
  }
  return JSON.stringify(result);
}

function formatArgs(args: Record<string, unknown>): string {
  const parts = Object.entries(args)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${k}: ${v}`);
  return parts.join(", ");
}

export function ToolResultCard({ toolCall }: ToolResultCardProps) {
  return (
    <div className="my-1 rounded-md border border-slate-200 bg-slate-50 p-2 text-xs dark:border-slate-700 dark:bg-slate-800/50">
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="text-[10px] font-mono">
          {toolCall.tool}
        </Badge>
        {Object.keys(toolCall.args).length > 0 && (
          <span className="text-slate-500 dark:text-slate-400">
            {formatArgs(toolCall.args)}
          </span>
        )}
      </div>
      <p className="mt-1 text-slate-600 dark:text-slate-300">
        {formatResult(toolCall.result)}
      </p>
    </div>
  );
}
