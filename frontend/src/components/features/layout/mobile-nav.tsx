"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart2, CheckSquare, LogOut, Menu, MessageSquare, X } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = authClient.useSession();
  const user = session?.user;

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/login");
  }

  return (
    <div className="flex sm:hidden">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(!open)}
        aria-label={open ? "Close menu" : "Open menu"}
        className="h-9 w-9 p-0 text-slate-600 dark:text-slate-300"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {open && (
        <div className="absolute left-0 right-0 top-full border-b bg-white/95 backdrop-blur-xl dark:border-slate-700 dark:bg-slate-950/95">
          <div className="mx-auto max-w-6xl space-y-1 px-4 py-3">
            {user && (
              <div className="border-b pb-3 dark:border-slate-700">
                <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300">{user.name || "User"}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
              </div>
            )}
            <Link
              href="/tasks"
              onClick={() => setOpen(false)}
              className={`flex w-full items-center gap-2 rounded-md py-2 text-sm transition-colors ${
                pathname === "/tasks"
                  ? "font-medium text-indigo-700 dark:text-indigo-300"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50"
              }`}
            >
              <CheckSquare className="h-4 w-4" />
              Tasks
            </Link>
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className={`flex w-full items-center gap-2 rounded-md py-2 text-sm transition-colors ${
                pathname === "/dashboard"
                  ? "font-medium text-indigo-700 dark:text-indigo-300"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50"
              }`}
            >
              <BarChart2 className="h-4 w-4" />
              Dashboard
            </Link>
            <Link
              href="/chat"
              onClick={() => setOpen(false)}
              className={`flex w-full items-center gap-2 rounded-md py-2 text-sm transition-colors ${
                pathname === "/chat"
                  ? "font-medium text-indigo-700 dark:text-indigo-300"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50"
              }`}
            >
              <MessageSquare className="h-4 w-4" />
              Chat
            </Link>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-slate-600 dark:text-slate-300">Theme</span>
              <ThemeToggle />
            </div>
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-2 rounded-md py-2 text-sm text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
