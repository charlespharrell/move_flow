// Stat card — dark surface, icon, trend-agnostic
export default function StatCard({ title, value, subtitle, icon, accent = "text-zinc-400" }) {
  return (
    // min-w-0: as a grid item the automatic minimum size is min-content, which lets a
    // long value (e.g. "₦1,527,500") push past its track instead of wrapping inside it.
    <div className="min-w-0 rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <div className="flex items-start justify-between gap-4">
        <p className="min-w-0 break-words text-xs font-medium uppercase tracking-wider text-zinc-400">{title}</p>
        {icon && (
          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-800 border border-zinc-700 ${accent}`}>
            {icon}
          </span>
        )}
      </div>
      <p className="mt-3 break-words text-2xl font-semibold tracking-tight text-zinc-50">{value}</p>
      {subtitle && <p className="mt-1 text-xs text-zinc-500">{subtitle}</p>}
    </div>
  );
}
