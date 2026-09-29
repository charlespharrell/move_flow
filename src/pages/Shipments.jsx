import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";
import { Link } from "react-router-dom";
import { useState } from "react";
import { getShipments } from "../services/shipmentService";
import { formatCurrency, formatDate } from "../utils/format";
import { SearchInput, Select } from "../components/ui/Input";
import Pagination from "../components/ui/Pagination";
import { EmptyState } from "../components/ui/States";
import Button from "../components/ui/Button";

function Shipments() {
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  const shipments = getShipments();

  // Handlers reset pagination when search/filter changes
  function handleSearchChange(e) {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  }

  function handleStatusChange(e) {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  }

  // Filter shipments
  const filteredShipments = shipments.filter((shipment) => {
    const search = searchTerm.toLowerCase();

    const matchesSearch =
      shipment.id.toLowerCase().includes(search) ||
      shipment.customer.toLowerCase().includes(search) ||
      (shipment.driver && shipment.driver.toLowerCase().includes(search));

    const matchesStatus = statusFilter === "All" || shipment.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Pagination calculations
  const shipmentsPerPage = 8;
  const totalPages = Math.max(1, Math.ceil(filteredShipments.length / shipmentsPerPage));
  const startIndex = (currentPage - 1) * shipmentsPerPage;
  const paginatedShipments = filteredShipments.slice(startIndex, startIndex + shipmentsPerPage);

  // Pagination result summary
  const firstResult = filteredShipments.length === 0 ? 0 : startIndex + 1;
  const lastResult = Math.min(startIndex + shipmentsPerPage, filteredShipments.length);

  const hasActiveFilters = searchTerm !== "" || statusFilter !== "All";

  return (
    <div>
      <PageHeader title="Shipments" description="Manage and monitor shipments across the network." />

      {/* Search / filter controls — stack on mobile */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full items-center gap-2 sm:max-w-md">
          <SearchInput
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search by ID, customer, driver…"
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
            <option value="Pending">Pending</option>
            <option value="Assigned">Assigned</option>
            <option value="In Transit">In Transit</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </Select>
        </div>
      </div>

      {/* Result summary */}
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-zinc-400">
          Showing <span className="font-medium text-zinc-200">{firstResult}–{lastResult}</span> of {filteredShipments.length} {filteredShipments.length === 1 ? "shipment" : "shipments"}
        </p>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm("");
              setStatusFilter("All");
            }}
            className="text-xs font-medium text-blue-400 hover:text-blue-300"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Table — dark surface, horizontal scroll on smaller screens */}
      <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="border-b border-zinc-800 bg-zinc-900">
              <tr>
                <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Shipment</th>
                <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Customer</th>
                <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Route</th>
                <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Driver</th>
                <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Status</th>
                <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Amount</th>
                <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Expected</th>
                <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-800">
              {filteredShipments.length > 0 ? (
                paginatedShipments.map((shipment) => (
                  <tr key={shipment.id} className="hover:bg-zinc-800/50 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-zinc-100">{shipment.id}</td>
                    <td className="px-5 py-3.5 text-zinc-300">{shipment.customer}</td>
                    <td className="px-5 py-3.5 text-zinc-400">
                      {shipment.origin} → {shipment.destination}
                    </td>
                    <td className="px-5 py-3.5 text-zinc-400">{shipment.driver || <span className="text-zinc-600">Unassigned</span>}</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={shipment.status} />
                    </td>
                    <td className="px-5 py-3.5 text-zinc-300">{formatCurrency(shipment.amount)}</td>
                    <td className="px-5 py-3.5 text-zinc-400">{formatDate(shipment.expectedDeliveryDate)}</td>
                    <td className="px-5 py-3.5">
                      <Link
                        to={`/shipments/${shipment.id}`}
                        className="inline-flex rounded-md border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-200 hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-0">
                    <EmptyState
                      title="No shipments found"
                      description={hasActiveFilters ? "Try adjusting your search or status filter." : "No shipments available."}
                      actionLabel={hasActiveFilters ? "Clear filters" : undefined}
                      onAction={
                        hasActiveFilters
                          ? () => {
                              setSearchTerm("");
                              setStatusFilter("All");
                            }
                          : undefined
                      }
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination controls */}
      {filteredShipments.length > 0 && (
        <div className="mt-4">
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      )}
    </div>
  );
}

export default Shipments;
