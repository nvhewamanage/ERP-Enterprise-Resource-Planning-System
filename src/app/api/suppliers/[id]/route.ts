import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { updateSupplierSchema } from "@/modules/supplier/validations/supplier.schema";
import { getSupplierById, updateSupplier, deleteSupplier } from "@/modules/supplier/services/supplier.service";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { error } = await requirePermission(req, "supplier:manage");
  if (error) return error;

  const { id } = await params;
  const supplier = await getSupplierById(id);
  if (!supplier) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(supplier);
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { error } = await requirePermission(req, "supplier:manage");
  if (error) return error;

  const { id } = await params;
  const body = await req.json();
  const parsed = updateSupplierSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const supplier = await updateSupplier(id, parsed.data);
  if (!supplier) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(supplier);
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const { error } = await requirePermission(req, "supplier:manage");
  if (error) return error;

  const { id } = await params;
  try {
    const ok = await deleteSupplier(id);
    if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return new NextResponse(null, { status: 204 });
  } catch {
    // FK violation: supplier still has purchase orders referencing it.
    return NextResponse.json(
      { error: "This supplier has existing purchase orders and can't be deleted." },
      { status: 409 }
    );
  }
}