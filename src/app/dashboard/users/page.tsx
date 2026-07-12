"use client";

import { useEffect, useState } from "react";
import type { User, Role } from "@/modules/users/types/user";
import { UserTable } from "@/modules/users/components/UserTable";
import { UserForm } from "@/modules/users/components/UserForm";
import { useAuthStore } from "@/store/auth.store";

export default function UsersPage() {
  const currentUser = useAuthStore((s) => s.user);

  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  async function loadUsers() {
    setLoading(true);
    setError(null);
    try {
      const [usersRes, rolesRes] = await Promise.all([fetch("/api/users"), fetch("/api/roles")]);
      if (!usersRes.ok || !rolesRes.ok) throw new Error("Request failed");
      setUsers(await usersRes.json());
      setRoles(await rolesRes.json());
    } catch {
      setError("Couldn't load users. Is the app connected to Postgres?");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch-on-mount
    loadUsers();
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Delete this user? This can't be undone.")) return;
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    if (res.ok) {
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } else {
      const body = await res.json().catch(() => null);
      alert(body?.error ?? "Couldn't delete this user.");
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-accent">Admin</p>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-900">Users</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {loading ? "Loading users…" : `${users.length} ${users.length === 1 ? "account" : "accounts"}`}
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          {showForm ? "Close" : "Add user"}
        </button>
      </div>

      {showForm && (
        <div className="mb-8">
          <UserForm
            roles={roles}
            onCreated={() => {
              setShowForm(false);
              loadUsers();
            }}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="animate-pulse rounded-lg border border-zinc-200 p-8 text-sm text-zinc-400">
          Fetching users…
        </div>
      ) : (
        !error && <UserTable users={users} currentUserId={currentUser?.id} onDelete={handleDelete} />
      )}
    </div>
  );
}