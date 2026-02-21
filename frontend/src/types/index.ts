export interface Task {
  id: number;
  user_id: string;
  title: string;
  description: string | null;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string | null;
  completed?: boolean;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
}

export interface ApiError {
  status: number;
  detail: string;
}

// Phase 3: Chat types

export interface ToolCallResult {
  tool: string;
  args: Record<string, unknown>;
  result: unknown;
}

export interface ChatResponse {
  response: string;
  tool_calls: ToolCallResult[];
  conversation_id: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "tool";
  content: string;
  tool_calls_json?: string | null;
  created_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}
