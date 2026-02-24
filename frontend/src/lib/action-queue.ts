import { get, set } from "idb-keyval";

export interface QueuedAction {
  id: string;
  type: "create" | "update" | "delete" | "toggle";
  payload: unknown;
  timestamp: number;
}

const queueKey = (userId: string) => `queue:${userId}`;

export async function enqueueAction(
  userId: string,
  action: Omit<QueuedAction, "id" | "timestamp">
): Promise<void> {
  const existing = (await get<QueuedAction[]>(queueKey(userId))) ?? [];
  await set(queueKey(userId), [
    ...existing,
    { ...action, id: crypto.randomUUID(), timestamp: Date.now() },
  ]);
}

export async function flushQueue(
  userId: string,
  executor: (action: QueuedAction) => Promise<void>
): Promise<{ attempted: number; failed: number }> {
  const queue = (await get<QueuedAction[]>(queueKey(userId))) ?? [];
  if (!queue.length) return { attempted: 0, failed: 0 };
  const failed: QueuedAction[] = [];
  for (const action of queue) {
    try {
      await executor(action);
    } catch {
      failed.push(action);
    }
  }
  await set(queueKey(userId), failed);
  return { attempted: queue.length, failed: failed.length };
}
