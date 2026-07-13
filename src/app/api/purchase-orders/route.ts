import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { createPurchaseOrderSchema } from "@/modules/purchase/validations/purchase-order.schema";
import { listPurchaseOrders, createPurchaseOrder } from "@/modules/purchase/services/purchase-order.service";

export async function GET(req: NextRequest) {
  const { error } = await requirePermission(req, "purchase:manage");
  if (error) return error;

  const orders = await listPurchaseOrders();
  return NextResponse.json(orders);
}

export async function POST(req: NextRequest) {
  const { error } = await requirePermission(req, "purchase:manage");
  if (error) return error;

  const body = await req.json();
  const parsed = createPurchaseOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const order = await createPurchaseOrder(parsed.data);
    return NextResponse.json(order, { status: 201 });
  } catch {
    // FK violation: bad supplierId/productId slipped through schema validation
    // (e.g. a stale dropdown referencing a deleted supplier/product).
    return NextResponse.json(
      { error: "One of the selected suppliers or products no longer exists." },
      { status: 409 }
    );
  }
}