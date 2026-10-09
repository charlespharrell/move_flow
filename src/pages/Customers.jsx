import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";
import { SearchInput, Select } from "../components/ui/Input";
import Pagination from "../components/ui/Pagination";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/States";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import CustomerForm from "../components/CustomerForm";
import { listCustomers, createCustomer } from "../services/customerService";
import { useAuth } from "../hooks/useAuth";
import { formatCurrency, formatDate } from "../utils/format";
import { describeApiError } from "../utils/apiError";
import { useToast } from "../components/ui/Toast";

const PER_PAGE = 8;
const SEARCH_DEBOUNCE_MS = 300;

function Customers() {
  const { role } = useAuth();
  // Administrator and Operations manage customers; Finance reads only.
  const canManage = role === "Administrator" || role === "Operations";
  const { addToast } = useToast();

  // Filter state — search is debounced before it reaches the API
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);

  // Last completed request. `key` is the query it answered, so a changed query
  // reads as "loading" without any setState inside the fetch effect.
  const queryKey = `${currentPage}|${debouncedSearch}|${statusFilter}|${reloadKey}`;
  const [completed, setCompleted] = useState({ key: null, data: null, error: null });

  // Create modal
  const [addOpen, setAddOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let cancelled = false;

    listCustomers({
      page: currentPage,
      limit: PER_PAGE,
      search: debouncedSearch,
      status: statusFilter === "All" ? undefined : statusFilter,
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
  }, [queryKey, currentPage, debouncedSearch, statusFilter, reloadKey]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loading = completed.key !== queryKey;
  const error = loading ? null : completed.error;
  const data = completed.data;

  // Handlers reset pagination when search/filter changes
  function handleSearchChange(e) {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  }

  function handleStatusChange(e) {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  }

  function clearFilters() {
    setSearchTerm("");
    setDebouncedSearch("");
    setStatusFilter("All");
    setCurrentPage(1);
  }

  async function handleAddCustomer(formData) {
    setCreating(true);
    try {
      const created = await createCustomer(formData);
      setAddOpen(false);
      setSearchTerm("");
      setDebouncedSearch("");
      setStatusFilter("All");
      setCurrentPage(1);
      setReloadKey((k) => k + 1);
      addToast(`Customer ${created?.businessName ?? formData.businessName} created`, "success");
    } catch (err) {
      addToast(describeApiError(err, { forbidden: "You do not have permission to create customers." }), "error");
    } finally {
      setCreating(false);
    }
  }

  const customers = data?.customers ?? [];
  const total = data?.pagination?.total ?? 0;
  const totalPages = data?.pagination?.totalPages ?? 1;
  const startIndex = (currentPage - 1) * PER_PAGE;

  // Pagination result summary
  const firstResult = total === 0 ? 0 : startIndex + 1;
  const lastResult = Math.min(startIndex + PER_PAGE, total);
  const hasActiveFilters = searchTerm !== "" || statusFilter !== "All";

  return (
    <div>
      <PageHeader
        title="Customers"
        description="Manage customers and view their shipment activity."
        action={
          canManage ? (
            <Button onClick={() => setAddOpen(true)}>
              Add Customer
            </Button>
          ) : undefined
        }
      />

      {canManage && (
        <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Customer">
          <CustomerForm
            onSubmit={handleAddCustomer}
            onCancel={() => setAddOpen(false)}
            submitting={creating}
            submitLabel="Save Customer"
          />
        </Modal>
      )}

      {/* Search / filter controls — stack on mobile */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full items-center gap-2 sm:max-w-md">
          <SearchInput
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search by ID, business, contact, email…"
            className="flex-1"
          />
          {searchTerm && (
            <Button variant="secondary" size="md" onClick={() => { setSearchTerm(""); setDebouncedSearch(""); setCurrentPage(1); }}>
              Clear
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Select value={statusFilter} onChange={handleStatusChange} className="w-full sm:w-44">
            <option value="All">All statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
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
            Showing <span className="font-medium text-zinc-200">{firstResult}–{lastResult}</span> of {total} {total === 1 ? "customer" : "customers"}
          </span>
        </p>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-xs font-medium text-blue-400 hover:text-blue-300"
          >
            Clear filters
          </button>
        )}
      </div>

      {error ? (
        <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
          <ErrorState
            title="Unable to load customers"
            description={describeApiError(error, { forbidden: "You do not have permission to view customers.", fallback: "Unable to load customers." })}
            onRetry={() => setReloadKey((k) => k + 1)}
          />
        </div>
      ) : !data ? (
        <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
          <LoadingState label="Loading customers…" />
        </div>
      ) : (
        /* Table — dark surface, horizontal scroll on smaller screens */
        <div className={`overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 ${loading ? "opacity-60" : ""}`} aria-busy={loading}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="border-b border-zinc-800 bg-zinc-900">
                <tr>
                  <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Customer</th>
                  <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Contact</th>
                  <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Email</th>
                  <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Phone</th>
                  <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Shipments</th>
                  <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Total Spending</th>
                  <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Status</th>
                  <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Joined</th>
                  <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {customers.length > 0 ? (
                  customers.map((c) => {
                    // Shipment aggregates embedded by the customers list API.
                    const stats = c.shipmentStats ?? { total: 0, active: 0, delivered: 0, totalSpending: 0 };
                    return (
                      <tr key={c.id} className="hover:bg-zinc-800/50 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="font-medium text-zinc-100">{c.businessName}</div>
                          <div className="text-xs font-mono text-zinc-500">{c.id}</div>
                        </td>
                        <td className="px-5 py-3.5 text-zinc-300">{c.contactName}</td>
                        <td className="px-5 py-3.5 text-zinc-400">{c.email}</td>
                        <td className="px-5 py-3.5 text-zinc-400">{c.phone}</td>
                        <td className="px-5 py-3.5 text-zinc-300">{stats.total}</td>
                        <td className="px-5 py-3.5 text-zinc-300">{formatCurrency(stats.totalSpending)}</td>
                        <td className="px-5 py-3.5"><StatusBadge status={c.status} /></td>
                        <td className="px-5 py-3.5 text-zinc-400">{formatDate(c.dateJoined)}</td>
                        <td className="px-5 py-3.5">
                          <Link
                            to={`/customers/${c.id}`}
                            className="inline-flex rounded-md border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-200 hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9} className="p-0">
                      <EmptyState
                        title="No customers found"
                        description={hasActiveFilters ? "Try adjusting your search or status filter." : "No customers available."}
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

export default Customers;
