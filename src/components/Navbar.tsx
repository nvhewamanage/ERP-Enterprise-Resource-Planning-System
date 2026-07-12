"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";

export default function Navbar() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  async function handleLogout() {
    await logout();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-black/[.08] bg-white px-6 dark:border-white/[.1] dark:bg-zinc-950">
      <div />
      <div className="flex items-center gap-3">
        {user && (
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium text-foreground">{user.name}</span>
            <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent">
              {user.role.replace("_", " ")}
            </span>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="rounded-lg border border-black/[.1] px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-white/[.15] dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          Log out
        </button>
      </div>
    </header>
  );
}