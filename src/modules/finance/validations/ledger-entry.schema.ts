import { z } from "zod";

// TODO: define real fields for LedgerEntry, matching the ledger_entries table
export const createLedgerEntrySchema = z.object({
  // e.g. name: z.string().min(1),
});

export const updateLedgerEntrySchema = createLedgerEntrySchema.partial();
