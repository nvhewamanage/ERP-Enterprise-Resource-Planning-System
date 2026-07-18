import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { listAuditLogs } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const { error } = await requirePermission(req, "audit:view");
  if (error) return error;

  const logs = await listAuditLogs();
  return NextResponse.json(logs);
}