import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { createSalesOrderSchema } from "@/modules/sales/validations/sales-order.schema";
import { listSalesOrders, createSalesOrder } from "@/modules/sales/services/sales-order.service";

export async function GET(req: NextRequest) {
  const { error } = await requirePermission(req, "sales:manage");
  if (error) return error;

  const orders = await listSalesOrders();
  return NextResponse.json(orders);
}

export async function POST(req: NextRequest) {
  const { error } = await requirePermission(req, "sales:manage");
  if (error) return error;

  const body = await req.json();
  const parsed = createSalesOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const order = await createSalesOrder(parsed.data);
    return NextResponse.json(order, { status: 201 });
  } catch {
    // FK violation: bad customerId/productId slipped through schema validation
    return NextResponse.json(
      { error: "One of the selected customers or products no longer exists." },
      { status: 409 }
    );
  }
}