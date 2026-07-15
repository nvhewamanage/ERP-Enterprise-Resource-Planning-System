import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { updateCustomerSchema } from "@/modules/sales/validations/customer.schema";
import { getCustomerById, updateCustomer, deleteCustomer } from "@/modules/sales/services/customer.service";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { error } = await requirePermission(req, "sales:manage");
  if (error) return error;

  const { id } = await params;
  const customer = await getCustomerById(id);
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(customer);
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { error } = await requirePermission(req, "sales:manage");
  if (error) return error;

  const { id } = await params;
  const body = await req.json();
  const parsed = updateCustomerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const customer = await updateCustomer(id, parsed.data);
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(customer);
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const { error } = await requirePermission(req, "sales:manage");
  if (error) return error;

  const { id } = await params;
  try {
    const ok = await deleteCustomer(id);
    if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return new NextResponse(null, { status: 204 });
  } catch {
    // FK violation: customer still has sales orders referencing it.
    return NextResponse.json(
      { error: "This customer has existing sales orders and can't be deleted." },
      { status: 409 }
    );
  }
}