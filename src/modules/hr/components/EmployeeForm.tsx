"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createEmployeeSchema, type CreateEmployeeSchema } from "../validations/employee.schema";

const FIELD =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent";
const LABEL = "mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500";

export function EmployeeForm({
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
  } = useForm<CreateEmployeeSchema>({
    resolver: zodResolver(createEmployeeSchema),
  });

  async function onSubmit(values: CreateEmployeeSchema) {
    const res = await fetch("/api/hr/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError("root", {
        message: body?.error ? "Check the highlighted fields." : "Couldn't save this employee. Try again.",
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
        <label className={LABEL} htmlFor="firstName">First name</label>
        <input id="firstName" className={FIELD} {...register("firstName")} />
        {errors.firstName && <p className="mt-1 text-xs text-rose-600">{errors.firstName.message}</p>}
      </div>

      <div>
        <label className={LABEL} htmlFor="lastName">Last name</label>
        <input id="lastName" className={FIELD} {...register("lastName")} />
        {errors.lastName && <p className="mt-1 text-xs text-rose-600">{errors.lastName.message}</p>}
      </div>

      <div>
        <label className={LABEL} htmlFor="email">Email</label>
        <input id="email" type="email" className={FIELD} {...register("email")} />
        {errors.email && <p className="mt-1 text-xs text-rose-600">{errors.email.message}</p>}
      </div>

      <div>
        <label className={LABEL} htmlFor="jobTitle">Job title</label>
        <input id="jobTitle" className={FIELD} {...register("jobTitle")} />
      </div>

      <div>
        <label className={LABEL} htmlFor="department">Department</label>
        <input id="department" className={FIELD} {...register("department")} />
      </div>

      <div>
        <label className={LABEL} htmlFor="hireDate">Hire date</label>
        <input id="hireDate" type="date" className={FIELD} {...register("hireDate")} />
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
          {isSubmitting ? "Saving…" : "Save employee"}
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
