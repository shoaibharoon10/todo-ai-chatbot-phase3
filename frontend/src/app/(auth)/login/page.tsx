import Link from "next/link";
import { LoginForm } from "@/components/features/auth/login-form";

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Welcome back
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Sign in to your account to continue
        </p>
      </div>

      <LoginForm />

      <p className="text-center text-sm text-slate-500 dark:text-slate-400">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
        >
          Create account
        </Link>
      </p>
    </div>
  );
}
