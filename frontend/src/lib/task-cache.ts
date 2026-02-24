import { get, set } from "idb-keyval";
import type { Task } from "@/types";

export const cacheTasksForUser = (userId: string, tasks: Task[]): Promise<void> =>
  set(`tasks:${userId}`, tasks);

export const getCachedTasksForUser = (userId: string): Promise<Task[] | undefined> =>
  get<Task[]>(`tasks:${userId}`);
