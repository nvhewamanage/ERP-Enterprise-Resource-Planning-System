import { z } from "zod";

// Ledger entries are single-sided lines (debit OR credit), not full
// double-entry transactions — this schema enforces exactly one side is
// set. There's no update schema: entries are append-only once created,
// matching standard accounting practice (fix mistakes with a new
// offsetting entry, don't rewrite history).
export const createLedgerEntrySchema = z
  .object({
    account: z.string().min(1, "Account is required"),
    description: z.string().optional(),
    debit: z.coerce.number().nonnegative("Debit can't be negative").optional(),
    credit: z.coerce.number().nonnegative("Credit can't be negative").optional(),
  })
  .refine((data) => (data.debit ?? 0) > 0 || (data.credit ?? 0) > 0, {
    message: "Enter a debit or a credit amount",
    path: ["debit"],
  })
  .refine((data) => !((data.debit ?? 0) > 0 && (data.credit ?? 0) > 0), {
    message: "An entry can't have both a debit and a credit — create two entries instead",
    path: ["credit"],
  });

export type CreateLedgerEntrySchema = z.infer<typeof createLedgerEntrySchema>;