import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { recordAudit } from "@/lib/audit";
import { updateProductSchema } from "@/modules/inventory/validations/product.schema";
import { getProductById, updateProduct, deleteProduct } from "@/modules/inventory/services/product.service";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { error } = await requirePermission(req, ["inventory:manage", "purchase:manage", "sales:manage"]);
  if (error) return error;

  const { id } = await params;
  const product = await getProductById(id);
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(product);
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { error } = await requirePermission(req, "inventory:manage");
  if (error) return error;

  const { id } = await params;
  const body = await req.json();
  const parsed = updateProductSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const product = await updateProduct(id, parsed.data);
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(product);
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const { error, session } = await requirePermission(req, "inventory:manage");
  if (error) return error;

  const { id } = await params;
  try {
    const existing = await getProductById(id);
    const ok = await deleteProduct(id);
    if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (existing) {
      await recordAudit(session, "product.delete", "product", id, { sku: existing.sku, name: existing.name });
    }

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    // Product has purchase/sales order history (see product.service.ts)
    const message = err instanceof Error ? err.message : "Couldn't delete this product.";
    return NextResponse.json({ error: message }, { status: 409 });
  }
}