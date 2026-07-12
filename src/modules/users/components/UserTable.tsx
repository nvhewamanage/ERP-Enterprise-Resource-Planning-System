import type { User } from "../types/user";
import { StatusBadge } from "./StatusBadge";
import { RoleBadge } from "./RoleBadge";

function formatDate(value: string | null) {
  if (!value) return "Never";
  return new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function UserTable({
  users,
  currentUserId,
  onDelete,
}: {
  users: User[];
  currentUserId?: string;
  onDelete: (id: string) => void;
}) {
  if (users.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 py-16 text-center">
        <p className="text-sm font-medium text-zinc-700">No users yet</p>
        <p className="mt-1 text-sm text-zinc-500">Add the first account to get started.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200">
      <table className="w-full text-left text-sm">
        <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
          <tr>
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Email</th>
            <th className="px-4 py-3 font-medium">Role</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Last login</th>
            <th className="px-4 py-3 font-medium" />
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {users.map((u) => (
            <tr key={u.id} className="hover:bg-zinc-50">
              <td className="px-4 py-3 font-medium text-zinc-900">{u.name}</td>
              <td className="px-4 py-3 font-mono text-xs text-zinc-600">{u.email}</td>
              <td className="px-4 py-3">
                <RoleBadge label={u.roleLabel} />
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={u.status} />
              </td>
              <td className="px-4 py-3 font-mono text-xs text-zinc-500">{formatDate(u.lastLoginAt)}</td>
              <td className="px-4 py-3 text-right">
                {u.id !== currentUserId && (
                  <button
                    onClick={() => onDelete(u.id)}
                    className="text-xs font-medium text-rose-600 hover:underline"
                  >
                    Delete
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}