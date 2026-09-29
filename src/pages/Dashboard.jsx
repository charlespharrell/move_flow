import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import RecentShipments from "../components/RecentShipments";
import StatusBadge from "../components/StatusBadge";
import { getDashboardStats, getRecentShipments, getShipments } from "../services/shipmentService";
import { getPaymentStats, getPayments } from "../services/paymentService";
import { formatCurrency } from "../utils/format";
import activity from "../data/activity";
import { Link } from "react-router-dom";

function Dashboard() {
  // Dashboard statistics — all derived from underlying data
  const stats = getDashboardStats();
  const paymentStats = getPaymentStats();
  const recent = getRecentShipments(5);

  // Status breakdown for overview
  const statusBreakdown = [
    { label: "Pending", value: stats.pending, color: "bg-amber-500" },
    { label: "Assigned", value: stats.assigned, color: "bg-violet-500" },
    { label: "In Transit", value: stats.inTransit, color: "bg-blue-500" },
    { label: "Delivered", value: stats.delivered, color: "bg-emerald-500" },
    { label: "Cancelled", value: stats.cancelled, color: "bg-zinc-600" },
  ];
  const maxStatus = Math.max(...statusBreakdown.map((s) => s.value), 1);

  // Shipment activity over time — derived from shipment createdAt (monthly buckets)
  const shipments = getShipments();
  const monthLabels = ["Sep", "Aug", "Jul", "Jun", "May", "Apr"];
  // Our mock dates are Aug–Sep 2026; group by month key "2026-09" etc.
  const activityBuckets = monthLabels
    .map((label, idx) => {
      const monthNum = 9 - idx; // 9=Sep down to 4=Apr
      const key = `2026-${String(monthNum).padStart(2, "0")}`;
      const count = shipments.filter((s) => s.createdAt.startsWith(key)).length;
      return { label, count };
    })
    .reverse();
  const maxActivity = Math.max(...activityBuckets.map((b) => b.count), 1);

  // Revenue trend — derived from paid payments grouped by month
  const payments = getPayments();
  const revenueBuckets = monthLabels
    .map((label, idx) => {
      const monthNum = 9 - idx;
      const key = `2026-${String(monthNum).padStart(2, "0")}`;
      const total = payments
        .filter((p) => p.status === "Paid" && p.createdAt.startsWith(key))
        .reduce((sum, p) => sum + p.amount, 0);
      return { label, total };
    })
    .reverse();
  const maxRevenue = Math.max(...revenueBuckets.map((b) => b.total), 1);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Operational overview — shipments, revenue, and activity across the MoveFlow network."
      />

      {/* Summary statistics — 5 cards, derived */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Total Shipments"
          value={stats.total}
          subtitle={`${stats.active} active · ${stats.delivered} delivered`}
          accent="text-zinc-400"
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M3 8.5l8-4 8 4-8 4-8-4z" />
              <path d="M3 12l8 4 8-4" />
            </svg>
          }
        />
        <StatCard
          title="Active Shipments"
          value={stats.active}
          subtitle={`${stats.assigned} assigned · ${stats.inTransit} in transit`}
          accent="text-blue-400"
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
            </svg>
          }
        />
        <StatCard
          title="Delivered"
          value={stats.delivered}
          subtitle={`${((stats.delivered / stats.total) * 100).toFixed(0)}% delivery rate`}
          accent="text-emerald-400"
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M5 12l4 4 10-10" />
            </svg>
          }
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(paymentStats.totalRevenue)}
          subtitle={`${paymentStats.paid} paid payments`}
          accent="text-blue-400"
          icon={<span className="text-xs font-bold">₦</span>}
        />
        <StatCard
          title="Pending Payments"
          value={paymentStats.pending}
          subtitle={`${paymentStats.failed} failed · ${paymentStats.refunded} refunded`}
          accent="text-amber-400"
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <circle cx="12" cy="12" r="8" />
              <path d="M12 7v5l3 2" />
            </svg>
          }
        />
      </div>

      {/* Middle row: status overview + revenue trend (derived) */}
      <div className="mt-6 grid gap-4 lg:grid-cols-5">
        {/* Shipment status distribution — derived */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 lg:col-span-3">
          <h2 className="text-sm font-semibold text-zinc-100">Shipment status distribution</h2>
          <p className="mt-1 text-xs text-zinc-500">{stats.total} shipments across 5 statuses — live data</p>

          <div className="mt-5 space-y-3">
            {statusBreakdown.map((row) => (
              <div key={row.label} className="flex items-center gap-3">
                <span className="w-20 text-xs font-medium text-zinc-400">{row.label}</span>
                <div className="flex-1">
                  <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className={`h-full rounded-full ${row.color}`}
                      style={{ width: `${(row.value / maxStatus) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="w-6 text-right text-xs font-semibold text-zinc-200">{row.value}</span>
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {statusBreakdown.map((s) => (
              <StatusBadge key={s.label} status={s.label} />
            ))}
          </div>
        </div>

        {/* Revenue trend — derived from paid payments per month */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold text-zinc-100">Revenue trend</h2>
          <p className="mt-1 text-xs text-zinc-500">Paid payments by month — derived</p>

          <div className="mt-5 flex items-end gap-1.5 h-28">
            {revenueBuckets.map((b) => (
              <div key={b.label} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] font-medium text-zinc-400">{b.total ? formatCurrency(b.total).replace("₦", "₦") : "—"}</span>
                <div
                  className="w-full rounded-t-md bg-emerald-600/90"
                  style={{ height: `${b.total ? Math.max(8, (b.total / maxRevenue) * 80) : 4}%` }}
                  title={`${b.label}: ${formatCurrency(b.total)}`}
                  aria-label={`${b.label} revenue ${formatCurrency(b.total)}`}
                />
                <span className="text-[10px] text-zinc-500">{b.label}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-zinc-800 pt-4">
            <div>
              <p className="text-xs text-zinc-500">Total paid</p>
              <p className="text-sm font-semibold text-zinc-100">{formatCurrency(paymentStats.totalRevenue)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-zinc-500">Avg paid payment</p>
              <p className="text-sm font-semibold text-zinc-100">
                {paymentStats.paid ? formatCurrency(Math.round(paymentStats.totalRevenue / paymentStats.paid)) : "—"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Shipment activity over time — derived */}
      <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <h2 className="text-sm font-semibold text-zinc-100">Shipment activity over time</h2>
        <p className="mt-1 text-xs text-zinc-500">Shipments created per month — derived from shipment data</p>
        <div className="mt-5 flex items-end gap-2 h-32">
          {activityBuckets.map((b) => (
            <div key={b.label} className="flex flex-1 flex-col items-center gap-1.5">
              <span className="text-xs font-medium text-zinc-300">{b.count}</span>
              <div
                className="w-full rounded-t-md bg-blue-600/90"
                style={{ height: `${b.count ? Math.max(10, (b.count / maxActivity) * 85) : 4}%` }}
                title={`${b.label}: ${b.count} shipments`}
              />
              <span className="text-xs text-zinc-500">{b.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent shipments + activity */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentShipments shipments={recent} />
        </div>

        {/* Recent activity / operational info */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900">
          <div className="border-b border-zinc-800 px-5 py-4">
            <h2 className="text-sm font-semibold text-zinc-100">Recent activity</h2>
            <p className="mt-1 text-xs text-zinc-500">Live operational events</p>
          </div>
          <div className="divide-y divide-zinc-800">
            {activity.map((item) => (
              <div key={item.id} className="flex gap-3 px-5 py-3.5">
                <span
                  className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                    item.type === "delivered"
                      ? "bg-emerald-500"
                      : item.type === "cancelled"
                        ? "bg-zinc-500"
                        : item.type === "payment"
                          ? "bg-blue-500"
                          : item.type === "assigned"
                            ? "bg-violet-500"
                            : "bg-amber-500"
                  }`}
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-snug text-zinc-300">{item.message}</p>
                  <p className="mt-1 text-xs text-zinc-500">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-zinc-800 px-5 py-3">
            <Link to="/shipments" className="text-xs font-medium text-blue-400 hover:text-blue-300">
              Go to shipments →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
