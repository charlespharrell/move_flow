import { useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";
import StatCard from "../components/StatCard";
import { SearchInput, Select } from "../components/ui/Input";
import Pagination from "../components/ui/Pagination";
import { EmptyState } from "../components/ui/States";
import { getPayments, getPaymentStats } from "../services/paymentService";
import { getCustomerById } from "../services/customerService";
import { formatCurrency, formatDate } from "../utils/format";

function Payments() {
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [methodFilter, setMethodFilter] = useState("All");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  const payments = getPayments();
  const stats = getPaymentStats();

  function handleSearchChange(e) {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  }
  function handleStatusChange(e) {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  }
  function handleMethodChange(e) {
    setMethodFilter(e.target.value);
    setCurrentPage(1);
  }

  // Filter payments — case-insensitive on id, shipment, customer, ref
  const filtered = payments.filter((p) => {
    const q = searchTerm.toLowerCase();
    const customer = getCustomerById(p.customerId);
    const customerName = customer?.businessName?.toLowerCase() || "";
    const matchesSearch =
      p.id.toLowerCase().includes(q) ||
      p.shipmentId.toLowerCase().includes(q) ||
      p.transactionReference.toLowerCase().includes(q) ||
      customerName.includes(q) ||
      p.customerId.toLowerCase().includes(q);
    const matchesStatus = statusFilter === "All" || p.status === statusFilter;
    const matchesMethod = methodFilter === "All" || p.paymentMethod === methodFilter;
    return matchesSearch && matchesStatus && matchesMethod;
  });

  // Pagination calculations
  const perPage = 8;
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const startIndex = (currentPage - 1) * perPage;
  const paginated = filtered.slice(startIndex, startIndex + perPage);

  const firstResult = filtered.length === 0 ? 0 : startIndex + 1;
  const lastResult = Math.min(startIndex + perPage, filtered.length);
  const hasActiveFilters = searchTerm !== "" || statusFilter !== "All" || methodFilter !== "All";

  function clearFilters() {
    setSearchTerm("");
    setStatusFilter("All");
    setMethodFilter("All");
    setCurrentPage(1);
  }

  return (
    <div>
      <PageHeader title="Payments" description="Track and manage shipment payments." />

      {/* Summary cards — derived */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Revenue" value={formatCurrency(stats.totalRevenue)} subtitle={`${stats.paid} paid payments`} accent="text-emerald-400" />
        <StatCard title="Paid" value={stats.paid} subtitle={`of ${stats.total} total`} accent="text-emerald-400" />
        <StatCard title="Pending" value={stats.pending} subtitle="Awaiting confirmation" accent="text-amber-400" />
        <StatCard title="Failed" value={stats.failed} subtitle={`${stats.refunded} refunded`} accent="text-red-400" />
      </div>

      {/* Search / filters */}
      <div className="mt-6 mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex w-full items-center gap-2 lg:max-w-md">
          <SearchInput
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search by payment, shipment, customer, ref…"
            className="flex-1"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => { setSearchTerm(""); setCurrentPage(1); }}
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-700"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Select value={statusFilter} onChange={handleStatusChange} className="w-full sm:w-36">
            <option value="All">All statuses</option>
            <option value="Pending">Pending</option>
            <option value="Paid">Paid</option>
            <option value="Failed">Failed</option>
            <option value="Refunded">Refunded</option>
          </Select>
          <Select value={methodFilter} onChange={handleMethodChange} className="w-full sm:w-40">
            <option value="All">All methods</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Card">Card</option>
            <option value="Cash">Cash</option>
            <option value="Online Payment">Online Payment</option>
          </Select>
        </div>
      </div>

      {/* Result summary */}
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-zinc-400">
          Showing <span className="font-medium text-zinc-200">{firstResult}–{lastResult}</span> of {filtered.length} {filtered.length === 1 ? "payment" : "payments"}
        </p>
        {hasActiveFilters && (
          <button type="button" onClick={clearFilters} className="text-xs font-medium text-blue-400 hover:text-blue-300">
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="border-b border-zinc-800 bg-zinc-900">
              <tr>
                <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Payment</th>
                <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Shipment</th>
                <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Customer</th>
                <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Amount</th>
                <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Method</th>
                <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Status</th>
                <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Date</th>
                <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filtered.length > 0 ? (
                paginated.map((p) => {
                  const customer = getCustomerById(p.customerId);
                  return (
                    <tr key={p.id} className="hover:bg-zinc-800/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-mono text-xs font-medium text-zinc-100">{p.id}</div>
                        <div className="text-xs text-zinc-500">{p.transactionReference}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <Link to={`/shipments/${p.shipmentId}`} className="font-mono text-xs font-medium text-blue-400 hover:text-blue-300">
                          {p.shipmentId}
                        </Link>
                      </td>
                      <td className="px-5 py-3.5">
                        {customer ? (
                          <Link to={`/customers/${customer.id}`} className="text-zinc-300 hover:text-zinc-100">
                            {customer.businessName}
                          </Link>
                        ) : (
                          <span className="text-zinc-500">{p.customerId}</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-zinc-300">{formatCurrency(p.amount)}</td>
                      <td className="px-5 py-3.5 text-zinc-400">{p.paymentMethod}</td>
                      <td className="px-5 py-3.5"><StatusBadge status={p.status} /></td>
                      <td className="px-5 py-3.5 text-zinc-400">{formatDate(p.createdAt)}</td>
                      <td className="px-5 py-3.5">
                        <Link to={`/payments/${p.id}`} className="inline-flex rounded-md border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-200 hover:bg-zinc-700">
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="p-0">
                    <EmptyState
                      title="No payments found"
                      description={hasActiveFilters ? "Try adjusting your search or filters." : "No payments available."}
                      actionLabel={hasActiveFilters ? "Clear filters" : undefined}
                      onAction={hasActiveFilters ? clearFilters : undefined}
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {filtered.length > 0 && (
        <div className="mt-4">
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      )}
    </div>
  );
}

export default Payments;
