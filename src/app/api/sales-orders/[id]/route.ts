import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { recordAudit } from "@/lib/audit";
import { sendLowStockAlertEmail } from "@/lib/email";
import { createNotification } from "@/modules/notifications/services/notification.service";
import { updateSalesOrderStatusSchema } from "@/modules/sales/validations/sales-order.schema";
import {
  getSalesOrderById,
  updateSalesOrderStatus,
  deleteSalesOrder,
} from "@/modules/sales/services/sales-order.service";
import { getProductById } from "@/modules/inventory/services/product.service";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { error } = await requirePermission(req, "sales:manage");
  if (error) return error;

  const { id } = await params;
  const order = await getSalesOrderById(id);
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(order);
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { error, session } = await requirePermission(req, "sales:manage");
  if (error) return error;

  const { id } = await params;
  const body = await req.json();
  const parsed = updateSalesOrderStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const order = await updateSalesOrderStatus(id, parsed.data.status);
    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await recordAudit(session, "sales_order.status_change", "sales_order", id, {
      status: parsed.data.status,
    });

    if (parsed.data.status === "fulfilled") {
      await checkLowStockAfterFulfillment(order.items.map((item) => item.productId));
    }

    return NextResponse.json(order);
  } catch (err) {
    // Invalid status transition, or not enough stock to fulfill
    const message = err instanceof Error ? err.message : "Couldn't update this order's status.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const { error, session } = await requirePermission(req, "sales:manage");
  if (error) return error;

  const { id } = await params;
  try {
    const existing = await getSalesOrderById(id);
    const ok = await deleteSalesOrder(id);
    if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (existing) {
      await recordAudit(session, "sales_order.delete", "sales_order", id, {
        customerName: existing.customerName,
      });
    }

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Couldn't delete this order.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

/**
 * After fulfilling a sales order, re-checks each affected product's stock
 * and raises a broadcast notification (plus an email, if ADMIN_ALERT_EMAIL
 * is configured) for anything now at or below its reorder level. Best
 * effort: a failure here shouldn't fail the order fulfillment that already
 * succeeded, same reasoning as audit logging.
 */
async function checkLowStockAfterFulfillment(productIds: string[]): Promise<void> {
  try {
    const lowStockItems = [];
    for (const productId of productIds) {
      const product = await getProductById(productId);
      if (product && product.quantityOnHand <= product.reorderLevel) {
        lowStockItems.push(product);
        await createNotification({
          type: "low_stock",
          message: `${product.name} (${product.sku}) is at or below its reorder level: ${product.quantityOnHand} left.`,
          link: "/dashboard/inventory",
        });
      }
    }
    if (lowStockItems.length > 0 && process.env.ADMIN_ALERT_EMAIL) {
      await sendLowStockAlertEmail(process.env.ADMIN_ALERT_EMAIL, lowStockItems);
    }
  } catch (err) {
    console.error("Low-stock check failed after fulfilling a sales order:", err);
  }
}