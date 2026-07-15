import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { updatePurchaseOrderStatusSchema } from "@/modules/purchase/validations/purchase-order.schema";
import {
  getPurchaseOrderById,
  updatePurchaseOrderStatus,
  deletePurchaseOrder,
} from "@/modules/purchase/services/purchase-order.service";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { error } = await requirePermission(req, "purchase:manage");
  if (error) return error;

  const { id } = await params;
  const order = await getPurchaseOrderById(id);
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(order);
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { error } = await requirePermission(req, "purchase:manage");
  if (error) return error;

  const { id } = await params;
  const body = await req.json();
  const parsed = updatePurchaseOrderStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const order = await updatePurchaseOrderStatus(id, parsed.data.status);
    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(order);
  } catch (err) {
    // Invalid status transition (e.g. trying to re-receive a received order)
    const message = err instanceof Error ? err.message : "Couldn't update this order's status.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const { error } = await requirePermission(req, "purchase:manage");
  if (error) return error;

  const { id } = await params;
  try {
    const ok = await deletePurchaseOrder(id);
    if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    // Only draft orders can be deleted (see purchase-order.service.ts)
    const message = err instanceof Error ? err.message : "Couldn't delete this order.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}