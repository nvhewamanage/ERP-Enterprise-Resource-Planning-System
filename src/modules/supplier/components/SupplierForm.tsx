"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createSupplierSchema, type CreateSupplierSchema } from "../validations/supplier.schema";

const FIELD =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent";
const LABEL = "mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500";

export function SupplierForm({
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
  } = useForm<CreateSupplierSchema>({
    resolver: zodResolver(createSupplierSchema),
  });

  async function onSubmit(values: CreateSupplierSchema) {
    const res = await fetch("/api/suppliers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError("root", {
        message: body?.error && typeof body.error === "string" ? body.error : "Couldn't save this supplier. Try again.",
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
      <div>
        <label className={LABEL} htmlFor="name">Supplier name</label>
        <input id="name" className={FIELD} {...register("name")} />
        {errors.name && <p className="mt-1 text-xs text-rose-600">{errors.name.message}</p>}
      </div>

      <div>
        <label className={LABEL} htmlFor="contactEmail">Contact email</label>
        <input id="contactEmail" type="email" className={FIELD} {...register("contactEmail")} />
        {errors.contactEmail && <p className="mt-1 text-xs text-rose-600">{errors.contactEmail.message}</p>}
      </div>

      <div>
        <label className={LABEL} htmlFor="phone">Phone</label>
        <input id="phone" className={FIELD} {...register("phone")} />
      </div>

      <div>
        <label className={LABEL} htmlFor="address">Address</label>
        <input id="address" className={FIELD} {...register("address")} />
      </div>

      {errors.root && (
        <p className="sm:col-span-2 text-sm text-rose-600">{errors.root.message}</p>
      )}

      <div className="flex items-center gap-3 sm:col-span-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isSubmitting ? "Saving…" : "Save supplier"}
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