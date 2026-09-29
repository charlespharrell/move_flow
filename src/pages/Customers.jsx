import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";
import { SearchInput, Select } from "../components/ui/Input";
import Pagination from "../components/ui/Pagination";
import { EmptyState } from "../components/ui/States";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import CustomerForm from "../components/CustomerForm";
import { getCustomers, getCustomerStats, addCustomer, subscribe } from "../services/customerService";
import { formatCurrency, formatDate } from "../utils/format";
import { useToast } from "../components/ui/Toast";

function Customers() {
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Reactive customers list — subscribe to service updates for persistence
  const [customers, setCustomers] = useState(() => getCustomers());
  const [addOpen, setAddOpen] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    const unsub = subscribe(() => setCustomers([...getCustomers()]));
    return unsub;
  }, []);

  // Handlers reset pagination when search/filter changes
  function handleSearchChange(e) {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  }

  function handleStatusChange(e) {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  }

  function handleAddCustomer(data) {
    const created = addCustomer(data);
    setAddOpen(false);
    setCurrentPage(1);
    addToast(`Customer ${created.businessName} created`, "success");
  }

  // Filter customers — case-insensitive on id, business, contact, email, phone
  const filtered = customers.filter((c) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      c.id.toLowerCase().includes(q) ||
      c.businessName.toLowerCase().includes(q) ||
      c.contactName.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q);
    const matchesStatus = statusFilter === "All" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Pagination calculations
  const perPage = 8;
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const startIndex = (currentPage - 1) * perPage;
  const paginated = filtered.slice(startIndex, startIndex + perPage);

  // Pagination result summary
  const firstResult = filtered.length === 0 ? 0 : startIndex + 1;
  const lastResult = Math.min(startIndex + perPage, filtered.length);
  const hasActiveFilters = searchTerm !== "" || statusFilter !== "All";

  return (
    <div>
      <PageHeader
        title="Customers"
        description="Manage customers and view their shipment activity."
        action={
          <Button onClick={() => setAddOpen(true)}>
            Add Customer
          </Button>
        }
      />

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Customer">
        <CustomerForm onSubmit={handleAddCustomer} onCancel={() => setAddOpen(false)} submitLabel="Save Customer" />
      </Modal>

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
            <Button variant="secondary" size="md" onClick={() => { setSearchTerm(""); setCurrentPage(1); }}>
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
        <p className="text-sm text-zinc-400">
          Showing <span className="font-medium text-zinc-200">{firstResult}–{lastResult}</span> of {filtered.length} {filtered.length === 1 ? "customer" : "customers"}
        </p>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => { setSearchTerm(""); setStatusFilter("All"); }}
            className="text-xs font-medium text-blue-400 hover:text-blue-300"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Table — dark surface, horizontal scroll on smaller screens */}
      <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
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
              {filtered.length > 0 ? (
                paginated.map((c) => {
                  const stats = getCustomerStats(c.id);
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
                      onAction={hasActiveFilters ? () => { setSearchTerm(""); setStatusFilter("All"); } : undefined}
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

export default Customers;
