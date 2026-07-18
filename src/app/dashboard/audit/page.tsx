"use client";

import { useEffect, useState } from "react";
import type { AuditLogEntry } from "@/lib/audit";

function formatDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDetails(details: Record<string, unknown> | null) {
  if (!details) return "—";
  return Object.entries(details)
    .map(([key, value]) => `${key}: ${value}`)
    .join(", ");
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/audit-logs");
        if (!res.ok) throw new Error("Request failed");
        setLogs(await res.json());
      } catch {
        setError("Couldn't load the audit log. Is the app connected to Postgres?");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8">
        <p className="font-mono text-xs uppercase tracking-widest text-accent">Security</p>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-900">Audit Log</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {loading ? "Loading…" : `Most recent ${logs.length} action${logs.length === 1 ? "" : "s"}`}
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="animate-pulse rounded-lg border border-zinc-200 p-8 text-sm text-zinc-400">
          Fetching audit log…
        </div>
      ) : error ? null : logs.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 py-16 text-center">
          <p className="text-sm font-medium text-zinc-700">No actions recorded yet</p>
          <p className="mt-1 text-sm text-zinc-500">Actions like creating users or changing order status will show up here.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-zinc-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">When</th>
                <th className="px-4 py-3 font-medium">Actor</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Entity</th>
                <th className="px-4 py-3 font-medium">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-zinc-50">
                  <td className="px-4 py-3 text-xs text-zinc-500">{formatDate(log.createdAt)}</td>
                  <td className="px-4 py-3 font-medium text-zinc-900">{log.actorName}</td>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-700">{log.action}</td>
                  <td className="px-4 py-3 text-xs text-zinc-600">
                    {log.entityType}
                    {log.entityId && <span className="text-zinc-400"> · {log.entityId.slice(0, 8)}</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-600">{formatDetails(log.details)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}