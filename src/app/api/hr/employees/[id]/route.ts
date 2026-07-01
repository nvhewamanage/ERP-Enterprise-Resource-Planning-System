import { NextRequest, NextResponse } from "next/server";
import { updateEmployeeSchema } from "@/modules/hr/validations/employee.schema";
import { getEmployeeById, updateEmployee, deleteEmployee } from "@/modules/hr/services/employee.service";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const employee = await getEmployeeById(params.id);
  if (!employee) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(employee);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const parsed = updateEmployeeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const employee = await updateEmployee(params.id, parsed.data);
  if (!employee) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(employee);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const ok = await deleteEmployee(params.id);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return new NextResponse(null, { status: 204 });
}
