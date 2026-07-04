import { NextRequest, NextResponse } from "next/server";
import { createProductSchema } from "@/modules/inventory/validations/product.schema";
import { listProducts, createProduct, getProductBySku } from "@/modules/inventory/services/product.service";

export async function GET() {
  const products = await listProducts();
  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = createProductSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await getProductBySku(parsed.data.sku);
  if (existing) {
    return NextResponse.json({ error: "A product with this SKU already exists" }, { status: 409 });
  }

  const product = await createProduct(parsed.data);
  return NextResponse.json(product, { status: 201 });
}
