import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Header } from "@/components/features/layout/header";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let session = null;
  let dbError = false;
  try {
    session = await auth.api.getSession({
      headers: await headers(),
    });
  } catch {
    // Neon unreachable (offline or cold start) — let through to show cached data
    dbError = true;
  }

  // Only hard-redirect if DB was reachable and returned no session
  if (!session && !dbError) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <Header />
      {children}
    </div>
  );
}
