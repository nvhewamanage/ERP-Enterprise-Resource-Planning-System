"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createProductSchema, type CreateProductSchema } from "../validations/product.schema";

const FIELD =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent";
const LABEL = "mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500";

export function ProductForm({
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
  } = useForm<CreateProductSchema>({
    resolver: zodResolver(createProductSchema),
    defaultValues: { quantityOnHand: 0, reorderLevel: 0, unitCost: 0 },
  });

  async function onSubmit(values: CreateProductSchema) {
    const res = await fetch("/api/inventory/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!res.ok) {
      setError("root", {
        message: res.status === 409 ? "A product with this SKU already exists." : "Couldn't save this product. Try again.",
      });
      return;
    }

    reset({ quantityOnHand: 0, reorderLevel: 0, unitCost: 0 });
    onCreated();
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="grid grid-cols-1 gap-4 rounded-lg border border-zinc-200 bg-zinc-50 p-5 sm:grid-cols-2"
    >
      <div>
        <label className={LABEL} htmlFor="sku">SKU</label>
        <input id="sku" className={FIELD} {...register("sku")} />
        {errors.sku && <p className="mt-1 text-xs text-rose-600">{errors.sku.message}</p>}
      </div>

      <div>
        <label className={LABEL} htmlFor="name">Name</label>
        <input id="name" className={FIELD} {...register("name")} />
        {errors.name && <p className="mt-1 text-xs text-rose-600">{errors.name.message}</p>}
      </div>

      <div>
        <label className={LABEL} htmlFor="quantityOnHand">Quantity on hand</label>
        <input id="quantityOnHand" type="number" min={0} className={FIELD} {...register("quantityOnHand")} />
        {errors.quantityOnHand && <p className="mt-1 text-xs text-rose-600">{errors.quantityOnHand.message}</p>}
      </div>

      <div>
        <label className={LABEL} htmlFor="reorderLevel">Reorder level</label>
        <input id="reorderLevel" type="number" min={0} className={FIELD} {...register("reorderLevel")} />
        {errors.reorderLevel && <p className="mt-1 text-xs text-rose-600">{errors.reorderLevel.message}</p>}
      </div>

      <div>
        <label className={LABEL} htmlFor="unitCost">Unit cost</label>
        <input id="unitCost" type="number" min={0} step="0.01" className={FIELD} {...register("unitCost")} />
        {errors.unitCost && <p className="mt-1 text-xs text-rose-600">{errors.unitCost.message}</p>}
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
          {isSubmitting ? "Saving…" : "Save product"}
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
