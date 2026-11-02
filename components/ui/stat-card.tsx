type StatCardProps = {
  label: string;
  value: string;
  description: string;
};

export default function StatCard({
  label,
  value,
  description,
}: StatCardProps) {
  return (
    <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5">
      <h3 className="text-sm font-medium text-slate-600">
        {label}
      </h3>

      <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 tabular-nums">
        {value}
      </p>

      <p className="mt-2 text-xs leading-5 text-slate-500">
        {description}
      </p>
    </article>
  );
}