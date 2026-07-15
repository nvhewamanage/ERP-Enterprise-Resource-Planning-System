"use client";

import { useEffect, useState } from "react";
import type { LedgerEntry, AccountBalance } from "@/modules/finance/types/ledger-entry";
import { LedgerTable, AccountBalanceSummary } from "@/modules/finance/components/LedgerTable";
import { LedgerEntryForm } from "@/modules/finance/components/LedgerEntryForm";

export default function FinancePage() {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [balances, setBalances] = useState<AccountBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/finance/ledger-entries");
      if (!res.ok) throw new Error("Request failed");
      const data = await res.json();
      setEntries(data.entries);
      setBalances(data.balances);
    } catch {
      setError("Couldn't load the ledger. Is the app connected to Postgres?");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch-on-mount
    loadAll();
  }, []);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-accent">Finance</p>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-900">General Ledger</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {loading ? "Loading ledger…" : `${entries.length} ${entries.length === 1 ? "entry" : "entries"}`}
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          {showForm ? "Close" : "Post entry"}
        </button>
      </div>

      {showForm && (
        <div className="mb-8">
          <LedgerEntryForm
            onCreated={() => {
              setShowForm(false);
              loadAll();
            }}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="animate-pulse rounded-lg border border-zinc-200 p-8 text-sm text-zinc-400">
          Fetching ledger…
        </div>
      ) : (
        !error && (
          <>
            <AccountBalanceSummary balances={balances} />
            <LedgerTable entries={entries} />
          </>
        )
      )}
    </div>
  );
}