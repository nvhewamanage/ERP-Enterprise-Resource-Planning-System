import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/jwt";
import { ATTACHMENT_ENTITY_PERMISSIONS } from "@/config/rbac";
import { saveFile } from "@/lib/storage";
import { listForEntity, createAttachment } from "@/modules/attachments/services/attachment.service";

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB

/** Every entityType must be explicitly mapped — unknown types are denied, not default-allowed. */
function permissionFor(entityType: string): string | null {
  return ATTACHMENT_ENTITY_PERMISSIONS[entityType] ?? null;
}

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const entityType = req.nextUrl.searchParams.get("entityType");
  const entityId = req.nextUrl.searchParams.get("entityId");
  if (!entityType || !entityId) {
    return NextResponse.json({ error: "entityType and entityId are required" }, { status: 400 });
  }

  const permission = permissionFor(entityType);
  if (!permission || !session.permissions.includes(permission)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const attachments = await listForEntity(entityType, entityId);
  return NextResponse.json(attachments);
}

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  const entityType = form.get("entityType");
  const entityId = form.get("entityId");

  if (!(file instanceof File) || typeof entityType !== "string" || typeof entityId !== "string") {
    return NextResponse.json({ error: "file, entityType, and entityId are all required" }, { status: 400 });
  }

  const permission = permissionFor(entityType);
  if (!permission || !session.permissions.includes(permission)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: "File exceeds the 10MB limit" }, { status: 413 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const storedName = await saveFile(file.name, buffer);

  const attachment = await createAttachment({
    entityType,
    entityId,
    fileName: file.name,
    mimeType: file.type || "application/octet-stream",
    sizeBytes: file.size,
    storagePath: storedName,
    uploadedBy: session.userId,
  });

  return NextResponse.json(attachment, { status: 201 });
}