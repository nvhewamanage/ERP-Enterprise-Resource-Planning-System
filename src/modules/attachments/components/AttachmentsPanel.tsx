"use client";

import { useEffect, useRef, useState } from "react";
import type { Attachment } from "../types/attachment";
import type { AttachmentEntityType } from "../types/attachment";

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AttachmentsPanel({
  entityType,
  entityId,
}: {
  entityType: AttachmentEntityType;
  entityId: string;
}) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/attachments?entityType=${entityType}&entityId=${entityId}`);
      if (res.ok) setAttachments(await res.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch-on-mount
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload when the record we're attached to changes
  }, [entityType, entityId]);

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("entityType", entityType);
    formData.append("entityId", entityId);

    try {
      const res = await fetch("/api/attachments", { method: "POST", body: formData });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error ?? "Upload failed.");
        return;
      }
      await load();
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this file? This can't be undone.")) return;
    const res = await fetch(`/api/attachments/${id}`, { method: "DELETE" });
    if (res.ok) {
      setAttachments((prev) => prev.filter((a) => a.id !== id));
    } else {
      alert("Couldn't delete this file.");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Attachments</p>
        <label className="cursor-pointer text-xs font-medium text-accent hover:underline">
          {uploading ? "Uploading…" : "+ Upload file"}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileSelected}
            disabled={uploading}
          />
        </label>
      </div>

      {error && <p className="text-xs text-rose-600">{error}</p>}

      {loading ? (
        <p className="text-xs text-zinc-400">Loading files…</p>
      ) : attachments.length === 0 ? (
        <p className="text-xs text-zinc-400">No files attached yet.</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {attachments.map((a) => (
            <li key={a.id} className="flex items-center justify-between rounded border border-zinc-200 bg-white px-2 py-1.5 text-xs">
              <a
                href={`/api/attachments/${a.id}`}
                className="truncate text-zinc-700 hover:text-accent hover:underline"
                title={a.fileName}
              >
                {a.fileName}
              </a>
              <div className="flex shrink-0 items-center gap-2 pl-2">
                <span className="text-zinc-400">{formatSize(a.sizeBytes)}</span>
                <button onClick={() => handleDelete(a.id)} className="font-medium text-rose-600 hover:underline">
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}