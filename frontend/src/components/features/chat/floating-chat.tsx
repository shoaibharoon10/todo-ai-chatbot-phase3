"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Maximize2, MessageSquare, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatContainer } from "./chat-container";

interface FloatingChatProps {
  userId: string;
  userName?: string;
  userEmail?: string;
}

export function FloatingChat({ userId, userName, userEmail }: FloatingChatProps) {
  const router = useRouter();
  const [isMinimized, setIsMinimized] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50 hidden md:block">
      {isMinimized ? (
        <div className="flex items-center gap-2 rounded-xl border bg-white px-4 py-2.5 shadow-lg dark:border-slate-700 dark:bg-slate-900">
          <MessageSquare className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Chat with AI
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="ml-2 h-6 w-6"
            onClick={() => setIsMinimized(false)}
            title="Expand chat"
          >
            <Maximize2 className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <div className="flex h-[480px] w-[360px] flex-col overflow-hidden rounded-xl border bg-white shadow-xl dark:border-slate-700 dark:bg-slate-950">
          {/* Header */}
          <div className="flex items-center justify-between bg-indigo-600 px-3 py-2 text-white">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="text-sm font-semibold">AI Assistant</span>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-white hover:bg-indigo-700 hover:text-white"
                onClick={() => router.push("/chat")}
                title="Open full chat"
              >
                <Maximize2 className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-white hover:bg-indigo-700 hover:text-white"
                onClick={() => setIsMinimized(true)}
                title="Minimize"
              >
                <Minus className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Chat content */}
          <div className="min-h-0 flex-1">
            <ChatContainer
              userId={userId}
              userInfo={{ userName, userEmail }}
              compact
            />
          </div>
        </div>
      )}
    </div>
  );
}
