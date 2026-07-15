export interface LedgerEntry {
  id: string;
  account: string;
  description: string | null;
  debit: number;
  credit: number;
  referenceType: string | null;
  referenceId: string | null;
  createdAt: string;
}

export interface CreateLedgerEntryInput {
  account: string;
  description?: string;
  debit?: number;
  credit?: number;
}

export interface AccountBalance {
  account: string;
  totalDebit: number;
  totalCredit: number;
  balance: number; // debit - credit
}