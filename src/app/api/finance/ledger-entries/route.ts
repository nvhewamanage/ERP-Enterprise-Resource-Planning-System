import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { createLedgerEntrySchema } from "@/modules/finance/validations/ledger-entry.schema";
import { listLedgerEntries, createLedgerEntry, getAccountBalances } from "@/modules/finance/services/ledger-entry.service";

export async function GET(req: NextRequest) {
  const { error } = await requirePermission(req, "finance:manage");
  if (error) return error;

  const [entries, balances] = await Promise.all([listLedgerEntries(), getAccountBalances()]);
  return NextResponse.json({ entries, balances });
}

export async function POST(req: NextRequest) {
  const { error } = await requirePermission(req, "finance:manage");
  if (error) return error;

  const body = await req.json();
  const parsed = createLedgerEntrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const entry = await createLedgerEntry(parsed.data);
  return NextResponse.json(entry, { status: 201 });
}