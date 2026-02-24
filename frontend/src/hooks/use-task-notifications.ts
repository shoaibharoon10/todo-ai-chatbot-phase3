"use client";

import { useEffect, useRef } from "react";
import type { Task } from "@/types";

export function useTaskNotifications(tasks: Task[]) {
  const notifiedIds = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (typeof Notification === "undefined") return;
    if (Notification.permission !== "granted") return;

    function check() {
      const now = Date.now();
      for (const task of tasks) {
        if (task.completed) continue;
        if (!task.due_date) continue;
        if (notifiedIds.current.has(task.id)) continue;

        const offsetMs = (task.reminder_offset_minutes ?? 60) * 60 * 1000;
        const dueTime = new Date(task.due_date).getTime();
        if (dueTime - now <= offsetMs) {
          notifiedIds.current.add(task.id);
          const timeStr = new Intl.DateTimeFormat(undefined, { timeStyle: "short" }).format(
            new Date(task.due_date)
          );
          const isOverdue = dueTime < now;
          const body = isOverdue ? `Overdue since ${timeStr}` : `Due at ${timeStr}`;
          const n = new Notification(task.title, { body });
          n.onclick = () => {
            window.focus();
            n.close();
          };
        }
      }
    }

    check();
    const id = setInterval(check, 60_000);
    return () => clearInterval(id);
  }, [tasks]);
}
