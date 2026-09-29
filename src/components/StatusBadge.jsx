// Status badge — dark theme with subtle backgrounds, text always visible
const config = {
  Pending: "bg-amber-500/15 text-amber-300 border-amber-500/20",
  Assigned: "bg-violet-500/15 text-violet-300 border-violet-500/20",
  "In Transit": "bg-blue-500/15 text-blue-300 border-blue-500/20",
  Delivered: "bg-emerald-500/15 text-emerald-300 border-emerald-500/20",
  Cancelled: "bg-zinc-700 text-zinc-300 border-zinc-600",
  // Customers / Drivers
  Active: "bg-emerald-500/15 text-emerald-300 border-emerald-500/20",
  Inactive: "bg-zinc-700 text-zinc-300 border-zinc-600",
  Available: "bg-emerald-500/15 text-emerald-300 border-emerald-500/20",
  Offline: "bg-zinc-700 text-zinc-300 border-zinc-600",
  Verified: "bg-emerald-500/15 text-emerald-300 border-emerald-500/20",
  Expired: "bg-red-500/15 text-red-300 border-red-500/20",
  // license
  Valid: "bg-emerald-500/15 text-emerald-300 border-emerald-500/20",
  "Expiring Soon": "bg-amber-500/15 text-amber-300 border-amber-500/20",
  // Payments
  Paid: "bg-emerald-500/15 text-emerald-300 border-emerald-500/20",
  Failed: "bg-red-500/15 text-red-300 border-red-500/20",
  Refunded: "bg-zinc-700 text-zinc-300 border-zinc-600",
};

const dotConfig = {
  Pending: "bg-amber-400",
  Assigned: "bg-violet-400",
  "In Transit": "bg-blue-400",
  Delivered: "bg-emerald-400",
  Cancelled: "bg-zinc-400",
  Active: "bg-emerald-400",
  Inactive: "bg-zinc-400",
  Available: "bg-emerald-400",
  Offline: "bg-zinc-400",
  Verified: "bg-emerald-400",
  Expired: "bg-red-400",
  Valid: "bg-emerald-400",
  "Expiring Soon": "bg-amber-400",
  Paid: "bg-emerald-400",
  Failed: "bg-red-400",
  Refunded: "bg-zinc-400",
};

export default function StatusBadge({ status }) {
  const base = config[status] || "bg-zinc-800 text-zinc-300 border-zinc-700";
  const dot = dotConfig[status] || "bg-zinc-400";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${base}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} aria-hidden="true" />
      {status}
    </span>
  );
}
