import type { LedgerEntry, AccountBalance } from "../types/ledger-entry";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function AccountBalanceSummary({ balances }: { balances: AccountBalance[] }) {
  if (balances.length === 0) return null;

  return (
    <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {balances.map((b) => (
        <div key={b.account} className="rounded-lg border border-zinc-200 bg-white p-3">
          <p className="truncate text-xs uppercase tracking-wide text-zinc-500">{b.account}</p>
          <p className={`mt-1 font-mono text-lg font-medium ${b.balance >= 0 ? "text-zinc-900" : "text-rose-600"}`}>
            Rs. {b.balance.toFixed(2)}
          </p>
        </div>
      ))}
    </div>
  );
}

export function LedgerTable({ entries }: { entries: LedgerEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 py-16 text-center">
        <p className="text-sm font-medium text-zinc-700">No ledger entries yet</p>
        <p className="mt-1 text-sm text-zinc-500">Post the first entry to start tracking the books.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200">
      <table className="w-full text-left text-sm">
        <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
          <tr>
            <th className="px-4 py-3 font-medium">Date</th>
            <th className="px-4 py-3 font-medium">Account</th>
            <th className="px-4 py-3 font-medium">Description</th>
            <th className="px-4 py-3 font-medium">Debit</th>
            <th className="px-4 py-3 font-medium">Credit</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {entries.map((e) => (
            <tr key={e.id} className="hover:bg-zinc-50">
              <td className="px-4 py-3 text-xs text-zinc-500">{formatDate(e.createdAt)}</td>
              <td className="px-4 py-3 font-medium text-zinc-900">{e.account}</td>
              <td className="px-4 py-3 text-zinc-600">{e.description ?? "—"}</td>
              <td className="px-4 py-3 font-mono text-zinc-700">{e.debit > 0 ? `Rs. ${e.debit.toFixed(2)}` : "—"}</td>
              <td className="px-4 py-3 font-mono text-zinc-700">{e.credit > 0 ? `Rs. ${e.credit.toFixed(2)}` : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}