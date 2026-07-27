import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { recordAudit } from "@/lib/audit";
import { updateEmployeeSchema } from "@/modules/hr/validations/employee.schema";
import { getEmployeeById, updateEmployee, deleteEmployee } from "@/modules/hr/services/employee.service";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { error } = await requirePermission(req, "hr:manage");
  if (error) return error;

  const { id } = await params;
  const employee = await getEmployeeById(id);
  if (!employee) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(employee);
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { error } = await requirePermission(req, "hr:manage");
  if (error) return error;

  const { id } = await params;
  const body = await req.json();
  const parsed = updateEmployeeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const employee = await updateEmployee(id, parsed.data);
  if (!employee) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(employee);
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const { error, session } = await requirePermission(req, "hr:delete");
  if (error) return error;

  const { id } = await params;
  const existing = await getEmployeeById(id);
  const ok = await deleteEmployee(id);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (existing) {
    await recordAudit(session, "employee.delete", "employee", id, {
      name: `${existing.firstName} ${existing.lastName}`,
    });
  }

  return new NextResponse(null, { status: 204 });
}