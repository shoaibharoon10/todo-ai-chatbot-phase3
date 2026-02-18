export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4">
      <div className="w-full max-w-md rounded-xl border border-white/20 bg-white/80 p-8 shadow-2xl backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/80">
        {children}
      </div>
    </div>
  );
}
