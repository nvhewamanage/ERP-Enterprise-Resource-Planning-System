import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { createCustomerSchema } from "@/modules/sales/validations/customer.schema";
import { listCustomers, createCustomer } from "@/modules/sales/services/customer.service";

export async function GET(req: NextRequest) {
  const { error } = await requirePermission(req, "sales:manage");
  if (error) return error;

  const customers = await listCustomers();
  return NextResponse.json(customers);
}

export async function POST(req: NextRequest) {
  const { error } = await requirePermission(req, "sales:manage");
  if (error) return error;

  const body = await req.json();
  const parsed = createCustomerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const customer = await createCustomer(parsed.data);
  return NextResponse.json(customer, { status: 201 });
}