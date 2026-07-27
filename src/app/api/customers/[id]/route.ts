import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { recordAudit } from "@/lib/audit";
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
  const { error, session } = await requirePermission(req, "sales:manage");
  if (error) return error;

  const { id } = await params;
  try {
    const existing = await getCustomerById(id);
    const ok = await deleteCustomer(id);
    if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (existing) {
      await recordAudit(session, "customer.delete", "customer", id, { name: existing.name });
    }

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    // Customer still has sales orders referencing it (see customer.service.ts)
    const message = err instanceof Error ? err.message : "Couldn't delete this customer.";
    return NextResponse.json({ error: message }, { status: 409 });
  }
}