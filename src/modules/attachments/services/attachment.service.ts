import { query } from "@/lib/db";
import { deleteFile } from "@/lib/storage";
import type { Attachment, CreateAttachmentInput } from "../types/attachment";

interface AttachmentRow {
  id: string;
  entity_type: string;
  entity_id: string;
  file_name: string;
  mime_type: string;
  size_bytes: string; // BIGINT comes back as string from pg
  storage_path: string;
  uploaded_by: string | null;
  created_at: string;
}

function mapRow(row: AttachmentRow): Attachment {
  return {
    id: row.id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    fileName: row.file_name,
    mimeType: row.mime_type,
    sizeBytes: Number(row.size_bytes),
    uploadedBy: row.uploaded_by,
    createdAt: row.created_at,
  };
}

export async function listForEntity(entityType: string, entityId: string): Promise<Attachment[]> {
  const result = await query<AttachmentRow>(
    `SELECT id, entity_type, entity_id, file_name, mime_type, size_bytes, storage_path, uploaded_by, created_at
     FROM file_attachments
     WHERE entity_type = $1 AND entity_id = $2
     ORDER BY created_at DESC`,
    [entityType, entityId]
  );
  return result.rows.map(mapRow);
}

/** Includes storage_path, unlike the public Attachment type — for internal use (download/delete) only. */
export async function getAttachmentRowById(id: string): Promise<(Attachment & { storagePath: string }) | null> {
  const result = await query<AttachmentRow>(
    `SELECT id, entity_type, entity_id, file_name, mime_type, size_bytes, storage_path, uploaded_by, created_at
     FROM file_attachments WHERE id = $1`,
    [id]
  );
  const row = result.rows[0];
  if (!row) return null;
  return { ...mapRow(row), storagePath: row.storage_path };
}

export async function createAttachment(input: CreateAttachmentInput): Promise<Attachment> {
  const result = await query<AttachmentRow>(
    `INSERT INTO file_attachments (entity_type, entity_id, file_name, mime_type, size_bytes, storage_path, uploaded_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, entity_type, entity_id, file_name, mime_type, size_bytes, storage_path, uploaded_by, created_at`,
    [input.entityType, input.entityId, input.fileName, input.mimeType, input.sizeBytes, input.storagePath, input.uploadedBy]
  );
  return mapRow(result.rows[0]);
}

export async function deleteAttachment(id: string): Promise<boolean> {
  const existing = await getAttachmentRowById(id);
  if (!existing) return false;

  await query("DELETE FROM file_attachments WHERE id = $1", [id]);
  await deleteFile(existing.storagePath);
  return true;
}