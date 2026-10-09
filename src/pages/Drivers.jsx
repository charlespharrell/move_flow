import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";
import { SearchInput, Select } from "../components/ui/Input";
import Pagination from "../components/ui/Pagination";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/States";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import DriverForm from "../components/DriverForm";
import { listDrivers, createDriver } from "../services/driverService";
import { useAuth } from "../hooks/useAuth";
import { describeApiError } from "../utils/apiError";
import { useToast } from "../components/ui/Toast";

const PER_PAGE = 8;
const SEARCH_DEBOUNCE_MS = 300;

function Drivers() {
  const { role } = useAuth();
  // Administrator and Operations manage drivers; Finance reads only.
  const canManage = role === "Administrator" || role === "Operations";
  const { addToast } = useToast();

  // Filter state — search is debounced before it reaches the API
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [verificationFilter, setVerificationFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);

  // Last completed request
  const queryKey = `${currentPage}|${debouncedSearch}|${statusFilter}|${verificationFilter}|${reloadKey}`;
  const [completed, setCompleted] = useState({ key: null, data: null, error: null });

  const [addOpen, setAddOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let cancelled = false;

    listDrivers({
      page: currentPage,
      limit: PER_PAGE,
      search: debouncedSearch,
      status: statusFilter === "All" ? undefined : statusFilter,
      verification: verificationFilter === "All" ? undefined : verificationFilter,
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
  }, [queryKey, currentPage, debouncedSearch, statusFilter, verificationFilter, reloadKey]);

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

  function clearFilters() {
    setSearchTerm("");
    setDebouncedSearch("");
    setStatusFilter("All");
    setVerificationFilter("All");
    setCurrentPage(1);
  }

  function resetAfterChange() {
    setSearchTerm("");
    setDebouncedSearch("");
    setStatusFilter("All");
    setVerificationFilter("All");
    setCurrentPage(1);
    setReloadKey((k) => k + 1);
  }

  async function handleAddDriver(formData) {
    const payload = {
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim().toLowerCase(),
      vehicle: formData.vehicle.trim(),
      vehicleType: formData.vehicleType || "TRUCK",
      licenseStatus: formData.licenseStatus || "VALID",
      verificationStatus: formData.verificationStatus || "PENDING",
      status: formData.status || "AVAILABLE",
      joinedDate: formData.joinedDate || undefined,
    };

    setCreating(true);
    try {
      const created = await createDriver(payload);
      setAddOpen(false);
      resetAfterChange();
      addToast(`Driver ${created?.name ?? formData.name} created`, "success");
    } catch (err) {
      addToast(describeApiError(err, { forbidden: "You do not have permission to create drivers." }), "error");
    } finally {
      setCreating(false);
    }
  }

  const drivers = data?.drivers ?? [];
  const total = data?.pagination?.total ?? 0;
  const totalPages = data?.pagination?.totalPages ?? 1;
  const startIndex = (currentPage - 1) * PER_PAGE;

  const firstResult = total === 0 ? 0 : startIndex + 1;
  const lastResult = Math.min(startIndex + PER_PAGE, total);
  const hasActiveFilters = searchTerm !== "" || statusFilter !== "All" || verificationFilter !== "All";

  return (
    <div>
      <PageHeader
        title="Drivers & Haulers"
        description="Manage drivers, vehicles and shipment assignments."
        action={
          canManage ? (
            <Button onClick={() => setAddOpen(true)}>Add Driver</Button>
          ) : undefined
        }
      />

      {canManage && (
        <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Driver">
          <DriverForm onSubmit={handleAddDriver} onCancel={() => setAddOpen(false)} submitting={creating} submitLabel="Save Driver" />
        </Modal>
      )}

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
            <Button variant="secondary" size="md" onClick={() => { setSearchTerm(""); setDebouncedSearch(""); setCurrentPage(1); }}>
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
        <p className="flex items-center gap-2 text-sm text-zinc-400">
          {loading && (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-600 border-t-blue-500" aria-hidden="true" />
          )}
          <span>
            Showing <span className="font-medium text-zinc-200">{firstResult}–{lastResult}</span> of {total} {total === 1 ? "driver" : "drivers"}
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
            title="Unable to load drivers"
            description={describeApiError(error, { forbidden: "You do not have permission to view drivers.", fallback: "Unable to load drivers." })}
            onRetry={() => setReloadKey((k) => k + 1)}
          />
        </div>
      ) : !data ? (
        <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
          <LoadingState label="Loading drivers…" />
        </div>
      ) : (
        <div className={`overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 ${loading ? "opacity-60" : ""}`} aria-busy={loading}>
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
                {drivers.length > 0 ? (
                  drivers.map((d) => (
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
                      <td className="px-5 py-3.5 text-zinc-300">{d.completed ?? 0}</td>
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
                  ))
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
      )}

      {!error && total > 0 && (
        <div className="mt-4">
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      )}
    </div>
  );
}

export default Drivers;