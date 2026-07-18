import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { requirePermission } from "@/lib/api-auth";

const BACKUPS_DIR = path.join(process.cwd(), "backups");

// Backup files are always named erp_backup_<timestamp>.sql.gz by
// scripts/backup.sh — reject anything else outright so a filename from
// the URL can never be used to read outside BACKUPS_DIR (no "..", no "/").
const SAFE_FILENAME = /^erp_backup_[0-9_]+\.sql\.gz$/;

type RouteParams = { params: Promise<{ filename: string }> };

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { error } = await requirePermission(req, "settings:manage");
  if (error) return error;

  const { filename } = await params;
  if (!SAFE_FILENAME.test(filename)) {
    return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
  }

  try {
    const buffer = await fs.readFile(path.join(BACKUPS_DIR, filename));
    const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
    return new NextResponse(arrayBuffer, {
      headers: {
        "Content-Type": "application/gzip",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}