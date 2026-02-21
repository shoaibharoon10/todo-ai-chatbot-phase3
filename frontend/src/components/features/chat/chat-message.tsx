"use client";

import { ToolResultCard } from "./tool-result-card";
import type { ToolCallResult } from "@/types";

interface ChatMessageProps {
  role: "user" | "assistant" | "tool";
  content: string;
  toolCallsJson?: string | null;
}

export function ChatMessage({ role, content, toolCallsJson }: ChatMessageProps) {
  const isUser = role === "user";

  let toolCalls: ToolCallResult[] = [];
  if (toolCallsJson) {
    try {
      toolCalls = JSON.parse(toolCallsJson);
    } catch {
      // ignore parse errors
    }
  }

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm sm:max-w-[70%] ${
          isUser
            ? "bg-indigo-600 text-white dark:bg-indigo-500"
            : "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100"
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{content}</p>
        {toolCalls.length > 0 && (
          <div className="mt-2 space-y-1">
            {toolCalls.map((tc, i) => (
              <ToolResultCard key={i} toolCall={tc} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
