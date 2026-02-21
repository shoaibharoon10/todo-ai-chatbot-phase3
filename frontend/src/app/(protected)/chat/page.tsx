"use client";

import { authClient } from "@/lib/auth-client";
import { ChatContainer } from "@/components/features/chat/chat-container";

export default function ChatPage() {
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;

  if (!userId) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
        <p className="text-sm text-slate-500">Loading...</p>
      </div>
    );
  }

  return (
    <main className="h-[calc(100vh-3.5rem)]">
      <ChatContainer userId={userId} />
    </main>
  );
}
