"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createPayrollRunSchema, type CreatePayrollRunSchema } from "../validations/payroll-run.schema";
import type { Employee } from "@/modules/hr/types/employee";

const FIELD =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent";
const LABEL = "mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500";

export function PayrollForm({
  employees,
  onCreated,
  onCancel,
}: {
  employees: Employee[];
  onCreated: () => void;
  onCancel: () => void;
}) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<CreatePayrollRunSchema>({
    resolver: zodResolver(createPayrollRunSchema),
  });

  const grossPay = useWatch({ control, name: "grossPay" });
  const deductions = useWatch({ control, name: "deductions" });
  const netPay = (Number(grossPay) || 0) - (Number(deductions) || 0);

  async function onSubmit(values: CreatePayrollRunSchema) {
    const res = await fetch("/api/payroll", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError("root", {
        message: body?.error && typeof body.error === "string" ? body.error : "Couldn't save this payroll run. Check the highlighted fields.",
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
        <label className={LABEL} htmlFor="employeeId">Employee</label>
        <select id="employeeId" className={FIELD} {...register("employeeId")}>
          <option value="">Select an employee…</option>
          {employees.map((e) => (
            <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
          ))}
        </select>
        {errors.employeeId && <p className="mt-1 text-xs text-rose-600">{errors.employeeId.message}</p>}
      </div>

      <div>
        <label className={LABEL} htmlFor="periodStart">Period start</label>
        <input id="periodStart" type="date" className={FIELD} {...register("periodStart")} />
        {errors.periodStart && <p className="mt-1 text-xs text-rose-600">{errors.periodStart.message}</p>}
      </div>

      <div>
        <label className={LABEL} htmlFor="periodEnd">Period end</label>
        <input id="periodEnd" type="date" className={FIELD} {...register("periodEnd")} />
        {errors.periodEnd && <p className="mt-1 text-xs text-rose-600">{errors.periodEnd.message}</p>}
      </div>

      <div>
        <label className={LABEL} htmlFor="grossPay">Gross pay</label>
        <input id="grossPay" type="number" min={0} step={0.01} className={FIELD} {...register("grossPay")} />
        {errors.grossPay && <p className="mt-1 text-xs text-rose-600">{errors.grossPay.message}</p>}
      </div>

      <div>
        <label className={LABEL} htmlFor="deductions">Deductions</label>
        <input id="deductions" type="number" min={0} step={0.01} className={FIELD} {...register("deductions")} />
        {errors.deductions && <p className="mt-1 text-xs text-rose-600">{errors.deductions.message}</p>}
      </div>

      <div className="sm:col-span-2 rounded-md border border-zinc-200 bg-white px-3 py-2">
        <p className="text-xs uppercase tracking-wide text-zinc-500">Net pay</p>
        <p className="font-mono text-lg font-medium text-zinc-900">Rs. {netPay.toFixed(2)}</p>
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
          {isSubmitting ? "Saving…" : "Create payroll run"}
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