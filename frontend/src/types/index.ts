export type PriorityLevel = "low" | "medium" | "high" | "urgent";

export interface WeeklyPoint {
  date: string;
  completed: number;
}

export interface StatsResponse {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  completion_rate: number;
  weekly: WeeklyPoint[];
}

export interface Tag {
  id: number;
  name: string;
  color: string;
}

export interface Task {
  id: number;
  user_id: string;
  title: string;
  description: string | null;
  completed: boolean;
  created_at: string;
  updated_at: string;
  priority: PriorityLevel;
  due_date?: string | null;
  recurrence_rule?: string | null;
  recurrence_parent_id?: number | null;
  next_occurrence?: Task | null;
  tags?: Tag[];
  notes?: string | null;
  reminder_offset_minutes?: number | null;
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  due_date?: string | null;
  recurrence_rule?: string | null;
  priority?: PriorityLevel;
  tag_ids?: number[];
  notes?: string | null;
  reminder_offset_minutes?: number | null;
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string | null;
  completed?: boolean;
  due_date?: string | null;
  recurrence_rule?: string | null;
  priority?: PriorityLevel;
  tag_ids?: number[];
  notes?: string | null;
  reminder_offset_minutes?: number | null;
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
