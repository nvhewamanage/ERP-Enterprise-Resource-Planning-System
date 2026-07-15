import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { createSupplierSchema } from "@/modules/supplier/validations/supplier.schema";
import { listSuppliers, createSupplier } from "@/modules/supplier/services/supplier.service";

export async function GET(req: NextRequest) {
  const { error } = await requirePermission(req, ["supplier:manage", "purchase:manage"]);
  if (error) return error;

  const suppliers = await listSuppliers();
  return NextResponse.json(suppliers);
}

export async function POST(req: NextRequest) {
  const { error } = await requirePermission(req, "supplier:manage");
  if (error) return error;

  const body = await req.json();
  const parsed = createSupplierSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const supplier = await createSupplier(parsed.data);
  return NextResponse.json(supplier, { status: 201 });
}