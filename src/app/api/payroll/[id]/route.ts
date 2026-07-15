import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { updatePayrollRunStatusSchema } from "@/modules/payroll/validations/payroll-run.schema";
import {
  getPayrollRunById,
  updatePayrollRunStatus,
  deletePayrollRun,
} from "@/modules/payroll/services/payroll-run.service";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { error } = await requirePermission(req, "payroll:manage");
  if (error) return error;

  const { id } = await params;
  const run = await getPayrollRunById(id);
  if (!run) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(run);
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { error } = await requirePermission(req, "payroll:manage");
  if (error) return error;

  const { id } = await params;
  const body = await req.json();
  const parsed = updatePayrollRunStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const run = await updatePayrollRunStatus(id, parsed.data.status);
    if (!run) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(run);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Couldn't update this payroll run.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const { error } = await requirePermission(req, "payroll:manage");
  if (error) return error;

  const { id } = await params;
  try {
    const ok = await deletePayrollRun(id);
    if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Couldn't delete this payroll run.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}