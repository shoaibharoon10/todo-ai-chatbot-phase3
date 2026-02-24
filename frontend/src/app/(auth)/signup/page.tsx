import Link from "next/link";
import { SignupForm } from "@/components/features/auth/signup-form";

export default function SignupPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Create your account
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Get started with TaskPulse in seconds
        </p>
      </div>

      <SignupForm />

      <p className="text-center text-sm text-slate-500 dark:text-slate-400">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
