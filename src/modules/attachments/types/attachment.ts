// Which module/record an attachment belongs to. Keep in sync with
// ATTACHMENT_ENTITY_PERMISSIONS in src/config/rbac.ts — every entityType
// used here needs a corresponding permission mapping there, or uploads to
// it will be rejected.
export type AttachmentEntityType = "purchase_order" | "sales_order" | "employee" | "supplier" | "product";

export interface Attachment {
  id: string;
  entityType: string;
  entityId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedBy: string | null;
  createdAt: string;
}

export interface CreateAttachmentInput {
  entityType: string;
  entityId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
  uploadedBy: string | null;
}