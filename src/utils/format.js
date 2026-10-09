// Currency formatting — Nigerian Naira
export function formatCurrency(amount) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

// Alternative compact format for cards (e.g. ₦1.2M)
export function formatCurrencyCompact(amount) {
  if (amount >= 1_000_000) return `₦${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1000) return `₦${(amount / 1000).toFixed(0)}K`;
  return formatCurrency(amount);
}

// Date-only strings (YYYY-MM-DD) are calendar dates, not instants. Parsing them
// as local components keeps the rendered day from shifting in time zones behind
// UTC; strings carrying a time or offset keep their normal parsing.
const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

function parseDate(value) {
  const match = DATE_ONLY.exec(value);
  if (!match) return new Date(value);

  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  const rollsOver =
    date.getFullYear() !== Number(year) ||
    date.getMonth() !== Number(month) - 1 ||
    date.getDate() !== Number(day);
  return rollsOver ? null : date;
}

// Date formatting — e.g. 28 Sep 2026
export function formatDate(dateString) {
  if (!dateString) return "—";
  const d = parseDate(dateString);
  if (!d || Number.isNaN(d.getTime())) return dateString;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(dateString) {
  if (!dateString) return "—";
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return dateString;
  return `${formatDate(dateString)} · ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
}
