"use client";

import { useEffect, useState } from "react";

interface BackupFile {
  fileName: string;
  sizeBytes: number;
  createdAt: string;
}

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function SettingsPage() {
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/backups");
        if (!res.ok) throw new Error("Request failed");
        setBackups(await res.json());
      } catch {
        setError("Couldn't load backups.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8">
        <p className="font-mono text-xs uppercase tracking-widest text-accent">Admin</p>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-900">Settings</h1>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-5">
        <div className="mb-1 flex items-center justify-between">
          <p className="text-sm font-medium text-zinc-700">Database backups</p>
        </div>
        <p className="mb-4 text-xs text-zinc-500">
          Backups are created by running <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono">npm run backup</code> on
          the host machine (not from this page) — see the README for details. This list shows what&apos;s
          already been created.
        </p>

        {error && <p className="text-sm text-rose-600">{error}</p>}

        {loading ? (
          <p className="text-sm text-zinc-400">Loading…</p>
        ) : backups.length === 0 ? (
          <p className="text-sm text-zinc-400">No backups yet. Run <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono">npm run backup</code> to create one.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="pb-2 font-medium">File</th>
                <th className="pb-2 font-medium">Created</th>
                <th className="pb-2 font-medium">Size</th>
                <th className="pb-2 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {backups.map((b) => (
                <tr key={b.fileName}>
                  <td className="py-2 font-mono text-xs text-zinc-700">{b.fileName}</td>
                  <td className="py-2 text-xs text-zinc-500">{formatDate(b.createdAt)}</td>
                  <td className="py-2 text-xs text-zinc-500">{formatSize(b.sizeBytes)}</td>
                  <td className="py-2 text-right">
                    <a
                      href={`/api/backups/${b.fileName}`}
                      className="text-xs font-medium text-accent hover:underline"
                    >
                      Download
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}