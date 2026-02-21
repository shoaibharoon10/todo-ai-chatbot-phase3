"use client";

import { useEffect, useRef } from "react";
import { ChatMessage } from "./chat-message";
import type { ChatMessage as ChatMessageType } from "@/types";
import { MessageSquare } from "lucide-react";

interface ChatMessageListProps {
  messages: ChatMessageType[];
  isLoading: boolean;
}

export function ChatMessageList({ messages, isLoading }: ChatMessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
        <MessageSquare className="h-10 w-10 text-slate-300 dark:text-slate-600" />
        <div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
            Start a conversation!
          </p>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            Try &quot;Show my tasks&quot; or &quot;Add a task called...&quot;
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-3 overflow-y-auto p-4">
      {messages.map((msg) => (
        <ChatMessage
          key={msg.id}
          role={msg.role}
          content={msg.content}
          toolCallsJson={msg.tool_calls_json}
        />
      ))}
      {isLoading && (
        <div className="flex justify-start">
          <div className="rounded-2xl bg-slate-100 px-4 py-2.5 dark:bg-slate-800">
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
            </div>
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
