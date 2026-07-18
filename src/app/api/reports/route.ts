import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { getReportsSummary } from "@/modules/reports/services/report.service";

export async function GET(req: NextRequest) {
  const { error } = await requirePermission(req, "reports:view");
  if (error) return error;

  const summary = await getReportsSummary();
  return NextResponse.json(summary);
}