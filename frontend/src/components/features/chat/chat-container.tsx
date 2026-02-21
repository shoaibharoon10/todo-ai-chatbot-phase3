"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ChatInput } from "./chat-input";
import { ChatMessageList } from "./chat-message-list";
import { sendChatMessage, getConversations, getMessages } from "@/lib/api";
import type { ChatMessage, ApiError } from "@/types";

interface UserInfo {
  userName?: string;
  userEmail?: string;
}

interface ChatContainerProps {
  userId: string;
  userInfo?: UserInfo;
  compact?: boolean;
}

export function ChatContainer({ userId, userInfo, compact }: ChatContainerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Load the most recent conversation on mount
  const loadHistory = useCallback(async () => {
    try {
      const conversations = await getConversations(userId);
      if (conversations.length > 0) {
        const latest = conversations[0];
        setConversationId(latest.id);
        const history = await getMessages(userId, latest.id);
        setMessages(
          history
            .filter((m) => m.role === "user" || m.role === "assistant")
            .map((m) => ({
              id: m.id,
              role: m.role as "user" | "assistant",
              content: m.content,
              tool_calls_json: m.tool_calls_json,
              created_at: m.created_at,
            })),
        );
      }
    } catch {
      // No conversations yet — that's fine
    } finally {
      setInitialLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  async function handleSend(message: string) {
    // Optimistically add user message
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: message,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await sendChatMessage(userId, message, {
        conversationId,
        userName: userInfo?.userName,
        userEmail: userInfo?.userEmail,
      });
      setConversationId(res.conversation_id);

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: res.response,
        tool_calls_json:
          res.tool_calls.length > 0 ? JSON.stringify(res.tool_calls) : null,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.status === 429) {
        toast.error("Rate limit reached. Please wait a moment.");
      } else if (apiErr.status === 502) {
        toast.error("AI service temporarily unavailable.");
      } else {
        toast.error(apiErr.detail || "Something went wrong. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  if (initialLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <ChatMessageList messages={messages} isLoading={isLoading} />
      <div
        className={`border-t bg-white dark:border-slate-700 dark:bg-slate-950 ${compact ? "p-2" : "p-4"}`}
      >
        <ChatInput onSend={handleSend} disabled={isLoading} />
      </div>
    </div>
  );
}
