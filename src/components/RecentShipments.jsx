import { Link } from "react-router-dom";
import StatusBadge from "./StatusBadge";
import { formatCurrency, formatDate } from "../utils/format";

// Recent shipments table — dark theme, horizontal scroll on small screens
export default function RecentShipments({ shipments }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900">
      <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
        <h2 className="text-sm font-semibold text-zinc-100">Recent Shipments</h2>
        <Link to="/shipments" className="text-xs font-medium text-blue-400 hover:text-blue-300">
          View all →
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-zinc-800 bg-zinc-900">
            <tr>
              <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Shipment</th>
              <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Customer</th>
              <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Route</th>
              <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Driver</th>
              <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Status</th>
              <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Amount</th>
              <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Created</th>
              <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {shipments.map((shipment) => (
              <tr key={shipment.id} className="hover:bg-zinc-800/50 transition-colors">
                <td className="px-5 py-3.5 font-medium text-zinc-100">{shipment.id}</td>
                <td className="px-5 py-3.5 text-zinc-300">{shipment.customer}</td>
                <td className="px-5 py-3.5 text-zinc-400">
                  {shipment.origin} → {shipment.destination}
                </td>
                <td className="px-5 py-3.5 text-zinc-400">{shipment.driver || "—"}</td>
                <td className="px-5 py-3.5">
                  <StatusBadge status={shipment.status} />
                </td>
                <td className="px-5 py-3.5 text-zinc-300">{formatCurrency(shipment.amount)}</td>
                <td className="px-5 py-3.5 text-zinc-500">{formatDate(shipment.createdAt)}</td>
                <td className="px-5 py-3.5">
                  <Link
                    to={`/shipments/${shipment.id}`}
                    className="inline-flex rounded-md border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-200 hover:bg-zinc-700"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
