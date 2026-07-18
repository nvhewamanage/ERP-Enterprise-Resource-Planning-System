import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/jwt";
import { ATTACHMENT_ENTITY_PERMISSIONS } from "@/config/rbac";
import { readFile } from "@/lib/storage";
import { getAttachmentRowById, deleteAttachment } from "@/modules/attachments/services/attachment.service";

type RouteParams = { params: Promise<{ id: string }> };

function permissionFor(entityType: string): string | null {
  return ATTACHMENT_ENTITY_PERMISSIONS[entityType] ?? null;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  const attachment = await getAttachmentRowById(id);
  if (!attachment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const permission = permissionFor(attachment.entityType);
  if (!permission || !session.permissions.includes(permission)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const buffer = await readFile(attachment.storagePath);
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
  return new NextResponse(arrayBuffer, {
    headers: {
      "Content-Type": attachment.mimeType,
      "Content-Disposition": `attachment; filename="${attachment.fileName.replace(/"/g, "")}"`,
      "Content-Length": String(attachment.sizeBytes),
    },
  });
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  const attachment = await getAttachmentRowById(id);
  if (!attachment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const permission = permissionFor(attachment.entityType);
  if (!permission || !session.permissions.includes(permission)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await deleteAttachment(id);
  return new NextResponse(null, { status: 204 });
}