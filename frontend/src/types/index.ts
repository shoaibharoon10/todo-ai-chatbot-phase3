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
