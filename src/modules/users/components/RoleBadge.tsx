export function RoleBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700">
      {label}
    </span>
  );
}