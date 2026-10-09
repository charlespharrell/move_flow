import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";
import StatCard from "../components/StatCard";
import { SearchInput, Select } from "../components/ui/Input";
import Pagination from "../components/ui/Pagination";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/States";
import { listPayments, getPaymentStats } from "../services/paymentService";
import { formatCurrency, formatDate } from "../utils/format";
import { describeApiError } from "../utils/apiError";

const PER_PAGE = 8;
const SEARCH_DEBOUNCE_MS = 300;

function Payments() {
  // Search and filter state — search is debounced before it reaches the API
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [methodFilter, setMethodFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);

  // Last completed request. `key` is the query it answered, so a changed query
  // reads as "loading" without any setState inside the fetch effect.
  const queryKey = `${currentPage}|${debouncedSearch}|${statusFilter}|${methodFilter}|${reloadKey}`;
  const [completed, setCompleted] = useState({ key: null, data: null, error: null });

  // Summary cards — global aggregates (not affected by the table filters),
  // fetched once. Cards fall back to "—" if the summary cannot be loaded.
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let cancelled = false;

    listPayments({
      page: currentPage,
      limit: PER_PAGE,
      search: debouncedSearch,
      status: statusFilter === "All" ? undefined : statusFilter,
      paymentMethod: methodFilter === "All" ? undefined : methodFilter,
    })
      .then((data) => {
        if (!cancelled) setCompleted({ key: queryKey, data, error: null });
      })
      .catch((err) => {
        if (!cancelled) setCompleted({ key: queryKey, data: null, error: err });
      });

    return () => {
      cancelled = true;
    };
  }, [queryKey, currentPage, debouncedSearch, statusFilter, methodFilter, reloadKey]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    let cancelled = false;

    getPaymentStats()
      .then((result) => {
        if (!cancelled) setStats(result);
      })
      .catch(() => {
        // The table's error state covers a dead backend; keep the cards graceful.
        if (!cancelled) setStats(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const loading = completed.key !== queryKey;
  const error = loading ? null : completed.error;
  const data = completed.data;

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

  function clearFilters() {
    setSearchTerm("");
    setDebouncedSearch("");
    setStatusFilter("All");
    setMethodFilter("All");
    setCurrentPage(1);
  }

  const payments = data?.payments ?? [];
  const total = data?.pagination?.total ?? 0;
  const totalPages = data?.pagination?.totalPages ?? 1;
  const startIndex = (currentPage - 1) * PER_PAGE;

  const firstResult = total === 0 ? 0 : startIndex + 1;
  const lastResult = Math.min(startIndex + PER_PAGE, total);
  const hasActiveFilters = searchTerm !== "" || statusFilter !== "All" || methodFilter !== "All";

  return (
    <div>
      <PageHeader title="Payments" description="Track and manage shipment payments." />

      {/* Summary cards — derived from the API's payment aggregates */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={stats ? formatCurrency(stats.totalRevenue) : "—"}
          subtitle={stats ? `${stats.paid} paid payments` : undefined}
          accent="text-emerald-400"
        />
        <StatCard
          title="Paid"
          value={stats ? stats.paid : "—"}
          subtitle={stats ? `of ${stats.total} total` : undefined}
          accent="text-emerald-400"
        />
        <StatCard
          title="Pending"
          value={stats ? stats.pending : "—"}
          subtitle={stats ? "Awaiting confirmation" : undefined}
          accent="text-amber-400"
        />
        <StatCard
          title="Failed"
          value={stats ? stats.failed : "—"}
          subtitle={stats ? `${stats.refunded} refunded` : undefined}
          accent="text-red-400"
        />
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
              onClick={() => { setSearchTerm(""); setDebouncedSearch(""); setCurrentPage(1); }}
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
        <p className="flex items-center gap-2 text-sm text-zinc-400">
          {loading && (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-600 border-t-blue-500" aria-hidden="true" />
          )}
          <span>
            Showing <span className="font-medium text-zinc-200">{firstResult}–{lastResult}</span> of {total} {total === 1 ? "payment" : "payments"}
          </span>
        </p>
        {hasActiveFilters && (
          <button type="button" onClick={clearFilters} className="text-xs font-medium text-blue-400 hover:text-blue-300">
            Clear filters
          </button>
        )}
      </div>

      {error ? (
        <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
          <ErrorState
            title="Unable to load payments"
            description={describeApiError(error, { forbidden: "You do not have permission to view payments.", fallback: "Unable to load payments." })}
            onRetry={() => setReloadKey((k) => k + 1)}
          />
        </div>
      ) : !data ? (
        <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
          <LoadingState label="Loading payments…" />
        </div>
      ) : (
        <div className={`overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 ${loading ? "opacity-60" : ""}`} aria-busy={loading}>
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
                {payments.length > 0 ? (
                  payments.map((p) => (
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
                        {p.customer ? (
                          <Link to={`/customers/${p.customerId}`} className="text-zinc-300 hover:text-zinc-100">
                            {p.customer}
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
                  ))
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
      )}

      {!error && total > 0 && (
        <div className="mt-4">
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      )}
    </div>
  );
}

export default Payments;
