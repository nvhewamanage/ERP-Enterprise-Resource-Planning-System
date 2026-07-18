export interface Notification {
  id: string;
  userId: string | null; // null = broadcast to everyone
  type: string; // e.g. 'low_stock', 'po_received', 'payroll_paid'
  message: string;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface CreateNotificationInput {
  userId?: string | null; // omit or null for a broadcast notification
  type: string;
  message: string;
  link?: string;
}