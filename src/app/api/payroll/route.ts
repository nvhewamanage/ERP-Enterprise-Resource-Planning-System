import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { createPayrollRunSchema } from "@/modules/payroll/validations/payroll-run.schema";
import { listPayrollRuns, createPayrollRun } from "@/modules/payroll/services/payroll-run.service";

export async function GET(req: NextRequest) {
  const { error } = await requirePermission(req, "payroll:manage");
  if (error) return error;

  const runs = await listPayrollRuns();
  return NextResponse.json(runs);
}

export async function POST(req: NextRequest) {
  const { error } = await requirePermission(req, "payroll:manage");
  if (error) return error;

  const body = await req.json();
  const parsed = createPayrollRunSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const run = await createPayrollRun(parsed.data);
    return NextResponse.json(run, { status: 201 });
  } catch {
    return NextResponse.json({ error: "The selected employee no longer exists." }, { status: 409 });
  }
}