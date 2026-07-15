"use client";

import { Fragment, useState } from "react";
import type { SalesOrderSummary, SalesOrder, SalesOrderStatus } from "../types/sales-order";
import { SOStatusBadge } from "./SOStatusBadge";

const NEXT_ACTIONS: Record<SalesOrderStatus, { label: string; next: SalesOrderStatus }[]> = {
  draft: [
    { label: "Confirm order", next: "confirmed" },
    { label: "Cancel", next: "cancelled" },
  ],
  confirmed: [
    { label: "Mark as fulfilled", next: "fulfilled" },
    { label: "Cancel", next: "cancelled" },
  ],
  fulfilled: [],
  cancelled: [],
};

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function SalesOrderTable({
  orders,
  onStatusChange,
  onDelete,
}: {
  orders: SalesOrderSummary[];
  onStatusChange: (id: string, status: SalesOrderStatus) => Promise<void>;
  onDelete: (id: string) => void;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<SalesOrder | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  async function toggleExpand(id: string) {
    if (expandedId === id) {
      setExpandedId(null);
      setDetail(null);
      return;
    }
    setExpandedId(id);
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/sales-orders/${id}`);
      if (res.ok) setDetail(await res.json());
    } finally {
      setLoadingDetail(false);
    }
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 py-16 text-center">
        <p className="text-sm font-medium text-zinc-700">No sales orders yet</p>
        <p className="mt-1 text-sm text-zinc-500">Create one to start fulfilling an order for a customer.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200">
      <table className="w-full text-left text-sm">
        <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
          <tr>
            <th className="px-4 py-3 font-medium">Customer</th>
            <th className="px-4 py-3 font-medium">Items</th>
            <th className="px-4 py-3 font-medium">Total</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Confirmed</th>
            <th className="px-4 py-3 font-medium">Fulfilled</th>
            <th className="px-4 py-3 font-medium" />
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {orders.map((o) => (
            <Fragment key={o.id}>
              <tr className="cursor-pointer hover:bg-zinc-50" onClick={() => toggleExpand(o.id)}>
                <td className="px-4 py-3 font-medium text-zinc-900">{o.customerName}</td>
                <td className="px-4 py-3 text-zinc-600">{o.itemCount}</td>
                <td className="px-4 py-3 font-mono text-zinc-900">${o.totalAmount.toFixed(2)}</td>
                <td className="px-4 py-3"><SOStatusBadge status={o.status} /></td>
                <td className="px-4 py-3 text-xs text-zinc-500">{formatDate(o.confirmedAt)}</td>
                <td className="px-4 py-3 text-xs text-zinc-500">{formatDate(o.fulfilledAt)}</td>
                <td className="px-4 py-3 text-right">
                  {o.status === "draft" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(o.id);
                      }}
                      className="text-xs font-medium text-rose-600 hover:underline"
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>

              {expandedId === o.id && (
                <tr className="bg-zinc-50">
                  <td colSpan={7} className="px-4 py-4">
                    {loadingDetail ? (
                      <p className="text-xs text-zinc-500">Loading line items…</p>
                    ) : detail ? (
                      <div className="flex flex-col gap-3">
                        <table className="w-full text-left text-xs">
                          <thead className="text-zinc-500">
                            <tr>
                              <th className="pb-1 pr-4 font-medium">Product</th>
                              <th className="pb-1 pr-4 font-medium">SKU</th>
                              <th className="pb-1 pr-4 font-medium">Qty</th>
                              <th className="pb-1 pr-4 font-medium">Unit price</th>
                              <th className="pb-1 font-medium">Line total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-200">
                            {detail.items.map((item) => (
                              <tr key={item.id}>
                                <td className="py-1.5 pr-4 text-zinc-900">{item.productName}</td>
                                <td className="py-1.5 pr-4 font-mono text-zinc-500">{item.sku}</td>
                                <td className="py-1.5 pr-4 text-zinc-700">{item.quantity}</td>
                                <td className="py-1.5 pr-4 font-mono text-zinc-700">${item.unitPrice.toFixed(2)}</td>
                                <td className="py-1.5 font-mono text-zinc-900">
                                  ${(item.quantity * item.unitPrice).toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        {NEXT_ACTIONS[o.status].length > 0 && (
                          <div className="flex gap-2">
                            {NEXT_ACTIONS[o.status].map((action) => (
                              <button
                                key={action.next}
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  await onStatusChange(o.id, action.next);
                                  setDetail(null);
                                  setExpandedId(null);
                                }}
                                className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
                              >
                                {action.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-rose-600">Couldn&apos;t load line items.</p>
                    )}
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}