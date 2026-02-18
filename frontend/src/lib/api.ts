import { authClient } from "@/lib/auth-client";
import type { Task, CreateTaskPayload, UpdateTaskPayload, ApiError } from "@/types";

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

export async function getTasks(filters?: { status?: string; sort?: string }): Promise<Task[]> {
  const params = new URLSearchParams();
  if (filters?.status) params.set("status", filters.status);
  if (filters?.sort) params.set("sort", filters.sort);
  const query = params.toString() ? `?${params.toString()}` : "";

  return request<Task[]>(`/api/tasks${query}`);
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

export async function toggleTask(taskId: number): Promise<Task> {
  return request<Task>(`/api/tasks/${taskId}/complete`, { method: "PATCH" });
}
