import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { requirePermission } from "@/lib/api-auth";

const BACKUPS_DIR = path.join(process.cwd(), "backups");

export async function GET(req: NextRequest) {
  const { error } = await requirePermission(req, "settings:manage");
  if (error) return error;

  try {
    const files = await fs.readdir(BACKUPS_DIR);
    const backups = await Promise.all(
      files
        .filter((f) => f.endsWith(".sql.gz"))
        .map(async (fileName) => {
          const stat = await fs.stat(path.join(BACKUPS_DIR, fileName));
          return { fileName, sizeBytes: stat.size, createdAt: stat.mtime.toISOString() };
        })
    );
    backups.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return NextResponse.json(backups);
  } catch {
    // No backups directory yet (e.g. `npm run backup` never run) — not an error.
    return NextResponse.json([]);
  }
}