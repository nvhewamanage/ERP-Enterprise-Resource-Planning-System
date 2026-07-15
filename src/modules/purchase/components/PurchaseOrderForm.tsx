"use client";

import { useForm, useFieldArray, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createPurchaseOrderSchema, type CreatePurchaseOrderSchema } from "../validations/purchase-order.schema";
import type { Supplier } from "@/modules/supplier/types/supplier";
import type { Product } from "@/modules/inventory/types/product";

const FIELD =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent";
const LABEL = "mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500";

export function PurchaseOrderForm({
  suppliers,
  products,
  onCreated,
  onCancel,
}: {
  suppliers: Supplier[];
  products: Product[];
  onCreated: () => void;
  onCancel: () => void;
}) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<CreatePurchaseOrderSchema>({
    resolver: zodResolver(createPurchaseOrderSchema),
    defaultValues: { supplierId: "", items: [{ productId: "", quantity: 1, unitPrice: 0 }] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const items = useWatch({ control, name: "items" });

  function productFor(productId: string) {
    return products.find((p) => p.id === productId);
  }

  function handleProductChange(index: number, productId: string) {
    const product = productFor(productId);
    setValue(`items.${index}.productId`, productId);
    if (product) {
      setValue(`items.${index}.unitPrice`, product.unitCost);
    }
  }

  const total = (items ?? []).reduce((sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0), 0);

  async function onSubmit(values: CreatePurchaseOrderSchema) {
    const res = await fetch("/api/purchase-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError("root", {
        message: body?.error && typeof body.error === "string" ? body.error : "Couldn't save this order. Check the highlighted fields.",
      });
      return;
    }

    reset({ supplierId: "", items: [{ productId: "", quantity: 1, unitPrice: 0 }] });
    onCreated();
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-zinc-50 p-5"
    >
      <div className="sm:w-1/2">
        <label className={LABEL} htmlFor="supplierId">Supplier</label>
        <select id="supplierId" className={FIELD} {...register("supplierId")}>
          <option value="">Select a supplier…</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        {errors.supplierId && <p className="mt-1 text-xs text-rose-600">{errors.supplierId.message}</p>}
      </div>

      <div>
        <label className={LABEL}>Line items</label>
        <div className="flex flex-col gap-3">
          {fields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-12 items-start gap-2 rounded-md border border-zinc-200 bg-white p-3">
              <div className="col-span-5">
                <Controller
                  control={control}
                  name={`items.${index}.productId`}
                  render={({ field: f }) => (
                    <select
                      className={FIELD}
                      value={f.value}
                      onChange={(e) => handleProductChange(index, e.target.value)}
                    >
                      <option value="">Select a product…</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                      ))}
                    </select>
                  )}
                />
                {errors.items?.[index]?.productId && (
                  <p className="mt-1 text-xs text-rose-600">{errors.items[index]?.productId?.message}</p>
                )}
              </div>

              <div className="col-span-3">
                <input
                  type="number"
                  min={1}
                  step={1}
                  placeholder="Qty"
                  className={FIELD}
                  {...register(`items.${index}.quantity`)}
                />
                {errors.items?.[index]?.quantity && (
                  <p className="mt-1 text-xs text-rose-600">{errors.items[index]?.quantity?.message}</p>
                )}
              </div>

              <div className="col-span-3">
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  placeholder="Unit price"
                  className={FIELD}
                  {...register(`items.${index}.unitPrice`)}
                />
                {errors.items?.[index]?.unitPrice && (
                  <p className="mt-1 text-xs text-rose-600">{errors.items[index]?.unitPrice?.message}</p>
                )}
              </div>

              <div className="col-span-1 flex justify-end pt-2">
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="text-xs font-medium text-rose-600 hover:underline"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => append({ productId: "", quantity: 1, unitPrice: 0 })}
          className="mt-3 text-xs font-medium text-accent hover:underline"
        >
          + Add line item
        </button>
        {errors.items?.root && <p className="mt-1 text-xs text-rose-600">{errors.items.root.message}</p>}
        {errors.items && !errors.items.root && typeof errors.items.message === "string" && (
          <p className="mt-1 text-xs text-rose-600">{errors.items.message}</p>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-zinc-200 pt-3">
        <p className="text-sm text-zinc-600">
          Total: <span className="font-mono font-medium text-zinc-900">${total.toFixed(2)}</span>
        </p>
      </div>

      {errors.root && <p className="text-sm text-rose-600">{errors.root.message}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isSubmitting ? "Saving…" : "Create purchase order"}
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