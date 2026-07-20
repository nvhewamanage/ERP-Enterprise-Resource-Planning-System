"use client";

import { useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import { useAuthStore } from "@/store/auth.store";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const fetchCurrentUser = useAuthStore((s) => s.fetchCurrentUser);

  // Middleware already guarantees a valid session cookie for any request
  // that reaches this layout — this just hydrates the client-side store
  // (used by the Sidebar/Navbar) with who that session belongs to.
  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  return (
    <div className="flex h-screen flex-1">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto bg-background p-6">{children}</main>
      </div>
    </div>
  );
}