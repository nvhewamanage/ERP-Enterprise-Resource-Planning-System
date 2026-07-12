"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useAuthStore } from "@/store/auth.store";

function DeniedBanner() {
  const searchParams = useSearchParams();
  if (searchParams.get("denied") !== "1") return null;
  return (
    <div className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-300">
      You don&apos;t have access to that section.
    </div>
  );
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div>
      <Suspense fallback={null}>
        <DeniedBanner />
      </Suspense>
      <h1 className="text-2xl font-semibold text-foreground">
        Welcome{user ? `, ${user.name}` : ""}
      </h1>
      <p className="mt-1 text-sm text-zinc-500">
        This is your ERP dashboard overview. Module summaries will appear here as each one is built out.
      </p>
    </div>
  );
}