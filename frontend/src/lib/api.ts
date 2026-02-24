import { authClient } from "@/lib/auth-client";
import type {
  Task,
  Tag,
  StatsResponse,
  CreateTaskPayload,
  UpdateTaskPayload,
  ApiError,
  ChatResponse,
  ChatMessage,
  Conversation,
} from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface FetchOptions extends Omit<RequestInit, "body" | "headers"> {
  headers?: Record<string, string>;
  body?: unknown;
}

async function getToken(): Promise<string | null> {
  try {
    const response = await fetch("/api/auth/token", {
      method: "GET",
      credentials: "include",
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.token ?? null;
  } catch {
    return null;
  }
}

async function request<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const token = await getToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const { body: _body, ...restOptions } = options;
  const config: RequestInit = {
    ...restOptions,
    headers,
  };

  if (options.body !== undefined) {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, config);

  if (response.status === 401) {
    await authClient.signOut();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw { status: 401, detail: "Session expired. Redirecting to login." } as ApiError;
  }

  if (response.status === 204) {
    return undefined as T;
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({ detail: "Request failed." }));
    throw {
      status: response.status,
      detail: body.detail || `Unexpected error (${response.status}).`,
    } as ApiError;
  }

  return response.json() as Promise<T>;
}

export async function getTasks(filters?: {
  status?: string;
  sort?: string;
  overdue?: boolean;
  priority?: string;
  tag?: number;
}): Promise<Task[]> {
  const params = new URLSearchParams();
  if (filters?.status) params.set("status", filters.status);
  if (filters?.sort) params.set("sort", filters.sort);
  if (filters?.overdue) params.set("overdue", "true");
  if (filters?.priority) params.set("priority", filters.priority);
  if (filters?.tag !== undefined && filters.tag !== null) params.set("tag", String(filters.tag));
  const query = params.toString() ? `?${params.toString()}` : "";

  return request<Task[]>(`/api/tasks${query}`);
}

export async function getTags(userId: string): Promise<Tag[]> {
  return request<Tag[]>(`/api/${userId}/tags`);
}

export async function createTag(userId: string, payload: { name: string; color?: string }): Promise<Tag> {
  return request<Tag>(`/api/${userId}/tags`, { method: "POST", body: payload });
}

export async function deleteTag(userId: string, tagId: number): Promise<void> {
  return request<void>(`/api/${userId}/tags/${tagId}`, { method: "DELETE" });
}

export async function getStats(userId: string): Promise<StatsResponse> {
  return request<StatsResponse>(`/api/${userId}/stats`);
}

export async function getTask(taskId: number): Promise<Task> {
  return request<Task>(`/api/tasks/${taskId}`);
}

export async function createTask(payload: CreateTaskPayload): Promise<Task> {
  return request<Task>(`/api/tasks`, { method: "POST", body: payload });
}

export async function updateTask(taskId: number, payload: UpdateTaskPayload): Promise<Task> {
  return request<Task>(`/api/tasks/${taskId}`, { method: "PUT", body: payload });
}

export async function deleteTask(taskId: number): Promise<void> {
  return request<void>(`/api/tasks/${taskId}`, { method: "DELETE" });
}

export async function toggleTask(taskId: number): Promise<Task & { next_occurrence?: Task | null }> {
  return request<Task & { next_occurrence?: Task | null }>(`/api/tasks/${taskId}/complete`, { method: "PATCH" });
}

// Phase 3: Chat API functions

export async function sendChatMessage(
  userId: string,
  message: string,
  options?: {
    conversationId?: string;
    userName?: string;
    userEmail?: string;
  },
): Promise<ChatResponse> {
  return request<ChatResponse>(`/api/${userId}/chat`, {
    method: "POST",
    body: {
      message,
      conversation_id: options?.conversationId,
      user_name: options?.userName,
      user_email: options?.userEmail,
    },
  });
}

export async function getConversations(userId: string): Promise<Conversation[]> {
  return request<Conversation[]>(`/api/${userId}/conversations`);
}

export async function getMessages(
  userId: string,
  conversationId: string,
): Promise<ChatMessage[]> {
  return request<ChatMessage[]>(
    `/api/${userId}/conversations/${conversationId}/messages`,
  );
}
