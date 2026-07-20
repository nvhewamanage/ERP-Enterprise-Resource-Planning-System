"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import NotificationBell from "./NotificationBell";

export default function Navbar() {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);

  async function handleLogout() {
    await logout();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-end gap-2 border-b border-card-border bg-white px-6">
      <NotificationBell />
      <button
        onClick={handleLogout}
        aria-label="Log out"
        title="Log out"
        className="rounded-lg border border-card-border p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
      >
        <LogOut size={16} strokeWidth={2} />
      </button>
    </header>
  );
}