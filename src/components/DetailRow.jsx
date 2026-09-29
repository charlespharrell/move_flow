export default function DetailRow({ label, children, className = "" }) {
  return (
    <div className={`flex flex-col gap-1 border-b border-zinc-800 py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between ${className}`}>
      <span className="text-sm text-zinc-400">{label}</span>
      <span className="text-sm font-medium text-zinc-100 sm:text-right">{children}</span>
    </div>
  );
}
