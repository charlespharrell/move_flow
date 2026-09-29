import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";
import { SearchInput, Select } from "../components/ui/Input";
import Pagination from "../components/ui/Pagination";
import { EmptyState } from "../components/ui/States";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import DriverForm from "../components/DriverForm";
import { getDrivers, getDriverStats, addDriver, subscribe } from "../services/driverService";
import { useToast } from "../components/ui/Toast";

function Drivers() {
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [verificationFilter, setVerificationFilter] = useState("All");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Reactive drivers list — subscribe to service updates
  const [drivers, setDrivers] = useState(() => getDrivers());
  const [addOpen, setAddOpen] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    const unsub = subscribe(() => setDrivers([...getDrivers()]));
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
  function handleVerificationChange(e) {
    setVerificationFilter(e.target.value);
    setCurrentPage(1);
  }

  function handleAddDriver(data) {
    const created = addDriver(data);
    setAddOpen(false);
    setCurrentPage(1);
    addToast(`Driver ${created.name} created`, "success");
  }

  // Filter drivers — case-insensitive on id, name, phone, email, vehicle
  const filtered = drivers.filter((d) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      d.id.toLowerCase().includes(q) ||
      d.name.toLowerCase().includes(q) ||
      d.phone.toLowerCase().includes(q) ||
      d.email.toLowerCase().includes(q) ||
      d.vehicle.toLowerCase().includes(q);
    const matchesStatus = statusFilter === "All" || d.status === statusFilter;
    const matchesVerification = verificationFilter === "All" || d.verificationStatus === verificationFilter;
    return matchesSearch && matchesStatus && matchesVerification;
  });

  // Pagination calculations
  const perPage = 8;
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const startIndex = (currentPage - 1) * perPage;
  const paginated = filtered.slice(startIndex, startIndex + perPage);

  const firstResult = filtered.length === 0 ? 0 : startIndex + 1;
  const lastResult = Math.min(startIndex + perPage, filtered.length);
  const hasActiveFilters = searchTerm !== "" || statusFilter !== "All" || verificationFilter !== "All";

  function clearFilters() {
    setSearchTerm("");
    setStatusFilter("All");
    setVerificationFilter("All");
    setCurrentPage(1);
  }

  return (
    <div>
      <PageHeader
        title="Drivers & Haulers"
        description="Manage drivers, vehicles and shipment assignments."
        action={<Button onClick={() => setAddOpen(true)}>Add Driver</Button>}
      />

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Driver">
        <DriverForm onSubmit={handleAddDriver} onCancel={() => setAddOpen(false)} submitLabel="Save Driver" />
      </Modal>

      {/* Search / filter controls */}
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex w-full items-center gap-2 lg:max-w-md">
          <SearchInput
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search by ID, name, phone, vehicle…"
            className="flex-1"
          />
          {searchTerm && (
            <Button variant="secondary" size="md" onClick={() => { setSearchTerm(""); setCurrentPage(1); }}>
              Clear
            </Button>
          )}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Select value={statusFilter} onChange={handleStatusChange} className="w-full sm:w-40">
            <option value="All">All statuses</option>
            <option value="Available">Available</option>
            <option value="Assigned">Assigned</option>
            <option value="Offline">Offline</option>
          </Select>
          <Select value={verificationFilter} onChange={handleVerificationChange} className="w-full sm:w-40">
            <option value="All">All verification</option>
            <option value="Verified">Verified</option>
            <option value="Pending">Pending</option>
            <option value="Expired">Expired</option>
          </Select>
        </div>
      </div>

      {/* Result summary */}
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-zinc-400">
          Showing <span className="font-medium text-zinc-200">{firstResult}–{lastResult}</span> of {filtered.length} {filtered.length === 1 ? "driver" : "drivers"}
        </p>
        {hasActiveFilters && (
          <button type="button" onClick={clearFilters} className="text-xs font-medium text-blue-400 hover:text-blue-300">
            Clear filters
          </button>
        )}
      </div>

      {/* Table — horizontal scroll */}
      <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px] text-left text-sm">
            <thead className="border-b border-zinc-800 bg-zinc-900">
              <tr>
                <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Driver / Hauler</th>
                <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Phone</th>
                <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Vehicle</th>
                <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Type</th>
                <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Current Shipment</th>
                <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Completed</th>
                <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Verification</th>
                <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Status</th>
                <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filtered.length > 0 ? (
                paginated.map((d) => {
                  const stats = getDriverStats(d.id);
                  return (
                    <tr key={d.id} className="hover:bg-zinc-800/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-zinc-100">{d.name}</div>
                        <div className="text-xs font-mono text-zinc-500">{d.id}</div>
                      </td>
                      <td className="px-5 py-3.5 text-zinc-400">{d.phone}</td>
                      <td className="px-5 py-3.5 text-zinc-300">{d.vehicle}</td>
                      <td className="px-5 py-3.5 text-zinc-400">{d.vehicleType}</td>
                      <td className="px-5 py-3.5">
                        {d.currentShipmentId ? (
                          <Link to={`/shipments/${d.currentShipmentId}`} className="font-mono text-xs font-medium text-blue-400 hover:text-blue-300">
                            {d.currentShipmentId}
                          </Link>
                        ) : (
                          <span className="text-xs text-zinc-600">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-zinc-300">{stats.completed}</td>
                      <td className="px-5 py-3.5"><StatusBadge status={d.verificationStatus} /></td>
                      <td className="px-5 py-3.5"><StatusBadge status={d.status} /></td>
                      <td className="px-5 py-3.5">
                        <Link
                          to={`/drivers/${d.id}`}
                          className="inline-flex rounded-md border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-200 hover:bg-zinc-700"
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
                      title="No drivers found"
                      description={hasActiveFilters ? "Try adjusting your search or filters." : "No drivers available."}
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

export default Drivers;
