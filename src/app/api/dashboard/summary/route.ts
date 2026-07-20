import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { getDashboardSummary } from "@/modules/dashboard/services/dashboard.service";

export async function GET(req: NextRequest) {
  const { error } = await requirePermission(req, "dashboard:view");
  if (error) return error;

  const summary = await getDashboardSummary();
  return NextResponse.json(summary);
}