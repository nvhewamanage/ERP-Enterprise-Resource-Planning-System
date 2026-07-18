import { query } from "@/lib/db";
import type { Notification, CreateNotificationInput } from "../types/notification";

interface NotificationRow {
  id: string;
  user_id: string | null;
  type: string;
  message: string;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

function mapRow(row: NotificationRow): Notification {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    message: row.message,
    link: row.link,
    readAt: row.read_at,
    createdAt: row.created_at,
  };
}

/**
 * Returns this user's personal notifications plus every broadcast
 * notification (user_id IS NULL), newest first.
 *
 * Note on broadcast read-state: `read_at` is a single column on the row,
 * not per-user. For a personal notification that's exactly right. For a
 * broadcast one (e.g. "product X is low on stock"), it means read/unread
 * is shared globally — once any one person dismisses it, it's dismissed
 * for everyone. That's a deliberate simplification for a small internal
 * team, not an oversight: tracking per-user read state on a shared alert
 * would need a separate notification_reads join table, which is more
 * machinery than a handful of internal users need. If that stops being
 * true, that's the table to add.
 */
export async function listForUser(userId: string, limit = 30): Promise<Notification[]> {
  const result = await query<NotificationRow>(
    `SELECT * FROM notifications
     WHERE user_id = $1 OR user_id IS NULL
     ORDER BY created_at DESC
     LIMIT $2`,
    [userId, limit]
  );
  return result.rows.map(mapRow);
}

export async function countUnreadForUser(userId: string): Promise<number> {
  const result = await query<{ count: string }>(
    `SELECT COUNT(*) FROM notifications
     WHERE (user_id = $1 OR user_id IS NULL) AND read_at IS NULL`,
    [userId]
  );
  return Number(result.rows[0].count);
}

export async function createNotification(input: CreateNotificationInput): Promise<Notification> {
  const result = await query<NotificationRow>(
    `INSERT INTO notifications (user_id, type, message, link)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [input.userId ?? null, input.type, input.message, input.link ?? null]
  );
  return mapRow(result.rows[0]);
}

export async function markRead(id: string): Promise<void> {
  await query("UPDATE notifications SET read_at = now() WHERE id = $1 AND read_at IS NULL", [id]);
}

export async function markAllReadForUser(userId: string): Promise<void> {
  await query(
    `UPDATE notifications SET read_at = now()
     WHERE read_at IS NULL AND (user_id = $1 OR user_id IS NULL)`,
    [userId]
  );
}