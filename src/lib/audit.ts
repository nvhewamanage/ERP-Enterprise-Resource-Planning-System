import { query } from "./db";
import type { SessionPayload } from "./jwt";

/**
 * Records one audit log entry. Call this from API routes right after a
 * mutation succeeds — see src/app/api/users/route.ts for the reference
 * usage. Deliberately fire-and-forget from the caller's perspective (it
 * awaits the insert, but a failure here shouldn't be allowed to fail the
 * request that triggered it, so callers wrap this in its own try/catch
 * rather than letting an audit-log hiccup roll back a real mutation).
 *
 * `actorName` is snapshotted at write time (not joined from `users` at
 * read time) so the log entry still reads sensibly after that user
 * account is deleted.
 */
export async function recordAudit(
  session: SessionPayload,
  action: string,
  entityType: string,
  entityId: string | null,
  details?: Record<string, unknown>
): Promise<void> {
  try {
    await query(
      `INSERT INTO audit_logs (actor_user_id, actor_name, action, entity_type, entity_id, details)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [session.userId, session.name, action, entityType, entityId, details ? JSON.stringify(details) : null]
    );
  } catch (err) {
    // Never let audit logging break the calling request.
    console.error("Failed to record audit log:", err);
  }
}

export interface AuditLogEntry {
  id: string;
  actorUserId: string | null;
  actorName: string;
  action: string;
  entityType: string;
  entityId: string | null;
  details: Record<string, unknown> | null;
  createdAt: string;
}

interface AuditLogRow {
  id: string;
  actor_user_id: string | null;
  actor_name: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

function mapRow(row: AuditLogRow): AuditLogEntry {
  return {
    id: row.id,
    actorUserId: row.actor_user_id,
    actorName: row.actor_name,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    details: row.details,
    createdAt: row.created_at,
  };
}

export async function listAuditLogs(limit = 200): Promise<AuditLogEntry[]> {
  const result = await query<AuditLogRow>(
    "SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT $1",
    [limit]
  );
  return result.rows.map(mapRow);
}