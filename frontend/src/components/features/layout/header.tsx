"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CheckSquare, MessageSquare } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";
import { MobileNav } from "./mobile-nav";

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-xl dark:border-slate-700 dark:bg-slate-950/80">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50">
              TaskFlow
            </span>
          </div>
          <nav className="hidden items-center gap-1 sm:flex">
            <Link
              href="/tasks"
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                pathname === "/tasks"
                  ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-50"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50"
              }`}
            >
              Tasks
            </Link>
            <Link
              href="/chat"
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                pathname === "/chat"
                  ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-50"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50"
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Chat
            </Link>
          </nav>
        </div>

        {/* Desktop nav */}
        <div className="hidden items-center gap-2 sm:flex">
          <ThemeToggle />
          <UserMenu />
        </div>

        {/* Mobile nav */}
        <MobileNav />
      </div>
    </header>
  );
}
