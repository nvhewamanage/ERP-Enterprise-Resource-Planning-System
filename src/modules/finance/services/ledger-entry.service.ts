import { query } from "@/lib/db";
import type { LedgerEntry, CreateLedgerEntryInput, AccountBalance } from "../types/ledger-entry";

interface LedgerEntryRow {
  id: string;
  account: string;
  description: string | null;
  debit: string; // NUMERIC comes back as string from pg
  credit: string;
  reference_type: string | null;
  reference_id: string | null;
  created_at: string;
}

function mapRow(row: LedgerEntryRow): LedgerEntry {
  return {
    id: row.id,
    account: row.account,
    description: row.description,
    debit: Number(row.debit),
    credit: Number(row.credit),
    referenceType: row.reference_type,
    referenceId: row.reference_id,
    createdAt: row.created_at,
  };
}

export async function listLedgerEntries(): Promise<LedgerEntry[]> {
  const result = await query<LedgerEntryRow>("SELECT * FROM ledger_entries ORDER BY created_at DESC");
  return result.rows.map(mapRow);
}

export async function createLedgerEntry(input: CreateLedgerEntryInput): Promise<LedgerEntry> {
  const result = await query<LedgerEntryRow>(
    `INSERT INTO ledger_entries (account, description, debit, credit)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [input.account, input.description ?? null, input.debit ?? 0, input.credit ?? 0]
  );
  return mapRow(result.rows[0]);
}

/** Per-account totals, used for the balance summary above the ledger table. */
export async function getAccountBalances(): Promise<AccountBalance[]> {
  const result = await query<{ account: string; total_debit: string; total_credit: string }>(
    `SELECT account, SUM(debit) AS total_debit, SUM(credit) AS total_credit
     FROM ledger_entries
     GROUP BY account
     ORDER BY account`
  );
  return result.rows.map((row) => ({
    account: row.account,
    totalDebit: Number(row.total_debit),
    totalCredit: Number(row.total_credit),
    balance: Number(row.total_debit) - Number(row.total_credit),
  }));
}