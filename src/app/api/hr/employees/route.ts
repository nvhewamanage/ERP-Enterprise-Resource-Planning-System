import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { createEmployeeSchema } from "@/modules/hr/validations/employee.schema";
import { listEmployees, createEmployee } from "@/modules/hr/services/employee.service";

export async function GET(req: NextRequest) {
  const { error } = await requirePermission(req, "hr:manage");
  if (error) return error;

  const employees = await listEmployees();
  return NextResponse.json(employees);
}

export async function POST(req: NextRequest) {
  const { error } = await requirePermission(req, "hr:manage");
  if (error) return error;

  const body = await req.json();
  const parsed = createEmployeeSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const employee = await createEmployee(parsed.data);
  return NextResponse.json(employee, { status: 201 });
}