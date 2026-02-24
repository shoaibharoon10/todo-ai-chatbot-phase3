"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function NotificationPermissionButton() {
  // null = not yet initialized (avoids SSR mismatch)
  const [permission, setPermission] = useState<NotificationPermission | null>(null);

  useEffect(() => {
    if (typeof Notification !== "undefined") {
      setPermission(Notification.permission);
    }
  }, []);

  // Hidden on SSR / unsupported browsers
  if (permission === null) return null;

  async function request() {
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === "granted") {
      toast.success("Task reminders enabled");
    } else if (result === "denied") {
      toast.error("Reminders blocked — enable notifications in browser settings");
    }
  }

  if (permission === "granted") {
    return (
      <Button variant="outline" size="sm" disabled className="gap-1.5">
        <Bell className="h-3.5 w-3.5 text-green-500" />
        Reminders On
      </Button>
    );
  }

  return (
    <Button variant="outline" size="sm" onClick={request} className="gap-1.5">
      <BellOff className="h-3.5 w-3.5" />
      Enable Reminders
    </Button>
  );
}
