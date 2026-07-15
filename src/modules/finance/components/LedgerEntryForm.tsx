"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createLedgerEntrySchema, type CreateLedgerEntrySchema } from "../validations/ledger-entry.schema";

const FIELD =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent";
const LABEL = "mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500";

export function LedgerEntryForm({
  onCreated,
  onCancel,
}: {
  onCreated: () => void;
  onCancel: () => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<CreateLedgerEntrySchema>({
    resolver: zodResolver(createLedgerEntrySchema),
  });

  async function onSubmit(values: CreateLedgerEntrySchema) {
    const res = await fetch("/api/finance/ledger-entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError("root", {
        message: body?.error && typeof body.error === "string" ? body.error : "Couldn't save this entry. Check the highlighted fields.",
      });
      return;
    }

    reset();
    onCreated();
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="grid grid-cols-1 gap-4 rounded-lg border border-zinc-200 bg-zinc-50 p-5 sm:grid-cols-2"
    >
      <div className="sm:col-span-2">
        <label className={LABEL} htmlFor="account">Account</label>
        <input id="account" className={FIELD} placeholder="e.g. Cash, Accounts Receivable, Revenue" {...register("account")} />
        {errors.account && <p className="mt-1 text-xs text-rose-600">{errors.account.message}</p>}
      </div>

      <div className="sm:col-span-2">
        <label className={LABEL} htmlFor="description">Description</label>
        <input id="description" className={FIELD} {...register("description")} />
      </div>

      <div>
        <label className={LABEL} htmlFor="debit">Debit</label>
        <input id="debit" type="number" min={0} step={0.01} className={FIELD} {...register("debit")} />
        {errors.debit && <p className="mt-1 text-xs text-rose-600">{errors.debit.message}</p>}
      </div>

      <div>
        <label className={LABEL} htmlFor="credit">Credit</label>
        <input id="credit" type="number" min={0} step={0.01} className={FIELD} {...register("credit")} />
        {errors.credit && <p className="mt-1 text-xs text-rose-600">{errors.credit.message}</p>}
      </div>

      <p className="sm:col-span-2 text-xs text-zinc-500">
        Enter an amount in exactly one of Debit or Credit — this is a single ledger line, not a balanced transaction.
      </p>

      {errors.root && (
        <p className="sm:col-span-2 text-sm text-rose-600">{errors.root.message}</p>
      )}

      <div className="flex items-center gap-3 sm:col-span-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isSubmitting ? "Saving…" : "Post entry"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}