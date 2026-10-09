import { useState, useEffect, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";
import DetailRow from "../components/DetailRow";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import StatCard from "../components/StatCard";
import Modal from "../components/ui/Modal";
import DriverForm from "../components/DriverForm";
import { ErrorState, LoadingState } from "../components/ui/States";
import { getDriver, updateDriver, deleteDriver } from "../services/driverService";
import { useAuth } from "../hooks/useAuth";
import { formatCurrency, formatDate } from "../utils/format";
import { describeApiError } from "../utils/apiError";
import { useToast } from "../components/ui/Toast";

const FORBIDDEN = "You do not have permission to manage drivers.";

function DriverDetails() {
  const { driverId } = useParams();
  const { role } = useAuth();
  const canManage = role === "Administrator" || role === "Operations";
  const { addToast } = useToast();

  const [reloadKey, setReloadKey] = useState(0);
  const queryKey = `${driverId}|${reloadKey}`;
  const [completed, setCompleted] = useState({ key: null, driver: null, related: null, error: null });

  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getDriver(driverId)
      .then((result) => {
        if (cancelled) return;
        if (!result) {
          setCompleted({ key: queryKey, driver: null, related: null, error: { status: 404 } });
        } else {
          setCompleted({ key: queryKey, driver: result.driver, related: result.related, error: null });
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setCompleted({ key: queryKey, driver: null, related: null, error: err });
      });

    return () => {
      cancelled = true;
    };
  }, [queryKey, driverId, reloadKey]);

  const loading = completed.key !== queryKey;
  const error = loading ? null : completed.error;
  const driver = completed.driver;
  const related = completed.related;

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  async function handleUpdate(formData) {
    const patch = {};
    const fields = ["name", "phone", "email", "vehicle", "vehicleType", "licenseStatus", "verificationStatus", "status", "joinedDate"];
    for (const field of fields) {
      const next = field === "email" ? String(formData[field] ?? "").trim().toLowerCase() : String(formData[field] ?? "").trim();
      const prev = String(driver[field] ?? "").trim();
      if (next !== prev) patch[field] = next || undefined;
    }
    if (Object.keys(patch).length === 0) {
      setEditOpen(false);
      addToast("No changes to save", "info");
      return;
    }

    setSaving(true);
    try {
      const updated = await updateDriver(driverId, patch);
      setCompleted((prev) => ({ ...prev, driver: updated ?? prev.driver }));
      setEditOpen(false);
      addToast(`Driver ${updated?.name ?? driver.name} updated`, "success");
    } catch (err) {
      addToast(describeApiError(err, { forbidden: FORBIDDEN }), "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteDriver(driverId);
      setDeleteOpen(false);
      addToast(`Driver ${driver.name} deleted`, "success");
      window.location.href = "/drivers";
    } catch (err) {
      addToast(describeApiError(err, { forbidden: FORBIDDEN, fallback: "Unable to delete this driver." }), "error");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div>
        <Link to="/drivers" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-blue-400 hover:text-blue-300">
          ← Back to Drivers
        </Link>
        <LoadingState label="Loading driver…" />
      </div>
    );
  }

  if (error?.status === 404) {
    return (
      <div>
        <Link to="/drivers" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-blue-400 hover:text-blue-300">
          ← Back to Drivers
        </Link>
        <PageHeader title="Driver Not Found" description="The driver you are looking for does not exist." />
        <Card>
          <p className="text-sm text-zinc-400">
            No driver found with ID: <span className="font-mono font-medium text-zinc-100">{driverId}</span>
          </p>
          <div className="mt-4">
            <Link to="/drivers"><Button variant="secondary">Back to Drivers</Button></Link>
          </div>
        </Card>
      </div>
    );
  }

  if (error || !driver) {
    return (
      <div>
        <Link to="/drivers" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-blue-400 hover:text-blue-300">
          ← Back to Drivers
        </Link>
        <ErrorState
          title="Unable to load driver"
          description={describeApiError(error, { forbidden: "You do not have permission to view drivers.", fallback: "Unable to load this driver." })}
          onRetry={reload}
        />
      </div>
    );
  }

  const shipments = related?.shipments?.items ?? [];
  const stats = related?.shipments ?? { total: 0, active: 0, completed: 0, totalValue: 0 };
  const current = related?.currentShipment ?? null;
  const sorted = [...shipments].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div>
      <Link to="/drivers" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-blue-400 hover:text-blue-300">
        ← Back to Drivers
      </Link>

      <PageHeader
        title={driver.name}
        description={`${driver.id} · ${driver.vehicle}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={driver.status} />
            <StatusBadge status={driver.verificationStatus} />
            {canManage && (
              <>
                <Button variant="secondary" size="md" onClick={() => setEditOpen(true)}>Edit Driver</Button>
                <Button variant="secondary" size="md" onClick={() => setDeleteOpen(true)}>Delete Driver</Button>
              </>
            )}
          </div>
        }
      />

      {canManage && (
        <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Driver">
          <DriverForm
            initialData={driver}
            onSubmit={handleUpdate}
            onCancel={() => setEditOpen(false)}
            submitting={saving}
            submitLabel="Save Changes"
          />
        </Modal>
      )}

      {canManage && (
        <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete Driver">
          <p className="text-sm text-zinc-300">
            Delete <span className="font-medium text-zinc-100">{driver.name}</span>{" "}
            (<span className="font-mono">{driver.id}</span>)? This cannot be undone.
          </p>
          <p className="mt-2 text-xs text-zinc-500">
            Drivers with shipment assignments cannot be deleted.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeleteOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete Driver"}
            </Button>
          </div>
        </Modal>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Shipments" value={stats.total} subtitle="All time" />
        <StatCard title="Active Shipments" value={stats.active} subtitle="Assigned + In Transit" accent="text-blue-400" />
        <StatCard title="Completed" value={stats.completed} subtitle="Delivered" accent="text-emerald-400" />
        <StatCard title="Total Value" value={formatCurrency(stats.totalValue)} subtitle="Across all shipments" accent="text-violet-400" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Left: profile + current assignment */}
        <div className="space-y-6">
          <Card>
            <h2 className="text-sm font-semibold text-zinc-100">Contact Information</h2>
            <div className="mt-3">
              <DetailRow label="Name">{driver.name}</DetailRow>
              <DetailRow label="Phone">{driver.phone}</DetailRow>
              <DetailRow label="Email">{driver.email}</DetailRow>
              <DetailRow label="ID"><span className="font-mono">{driver.id}</span></DetailRow>
            </div>
          </Card>

          <Card>
            <h2 className="text-sm font-semibold text-zinc-100">Vehicle Information</h2>
            <div className="mt-3">
              <DetailRow label="Vehicle">{driver.vehicle}</DetailRow>
              <DetailRow label="Type">{driver.vehicleType}</DetailRow>
              <DetailRow label="License"><StatusBadge status={driver.licenseStatus} /></DetailRow>
              <DetailRow label="Verification"><StatusBadge status={driver.verificationStatus} /></DetailRow>
            </div>
          </Card>

          <Card>
            <h2 className="text-sm font-semibold text-zinc-100">Driver Status</h2>
            <div className="mt-3">
              <DetailRow label="Availability"><StatusBadge status={driver.status} /></DetailRow>
              <DetailRow label="Joined">{formatDate(driver.joinedDate)}</DetailRow>
              <DetailRow label="Current shipment">
                {current?.id ? (
                  <Link to={`/shipments/${current.id}`} className="font-mono text-blue-400 hover:text-blue-300">{current.id}</Link>
                ) : (
                  <span className="text-zinc-500">No active shipment</span>
                )}
              </DetailRow>
            </div>
          </Card>

          {/* Current Assignment prominent */}
          <Card>
            <h2 className="text-sm font-semibold text-zinc-100">Current Assignment</h2>
            {current?.id ? (
              <div className="mt-3 rounded-lg border border-blue-900/40 bg-blue-950/20 p-4">
                <p className="font-mono text-sm font-semibold text-blue-300">{current.id}</p>
                <p className="mt-1 text-sm text-zinc-300">{current.origin} → {current.destination}</p>
                <div className="mt-2">
                  <StatusBadge status={current.status} />
                </div>
                <p className="mt-2 text-xs text-zinc-500">Customer: {current.customer} · {formatCurrency(current.amount)}</p>
                <div className="mt-3">
                  <Link to={`/shipments/${current.id}`} className="inline-flex rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500">View Shipment</Link>
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm text-zinc-500">No active shipment — driver is {String(driver.status || "").toLowerCase()}.</p>
            )}
          </Card>
        </div>

        {/* Right: shipment history */}
        <div className="lg:col-span-2">
          <Card padding="p-0" className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
              <div>
                <h2 className="text-sm font-semibold text-zinc-100">Shipment History</h2>
                <p className="text-xs text-zinc-500">{shipments.length} {shipments.length === 1 ? "shipment" : "shipments"} for this driver</p>
              </div>
              {shipments.length > 0 && <span className="text-xs text-zinc-500">{formatCurrency(stats.totalValue)} total</span>}
            </div>

            {shipments.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p className="text-sm text-zinc-500">No shipments assigned to this driver yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="border-b border-zinc-800">
                    <tr>
                      <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Shipment</th>
                      <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Customer</th>
                      <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Route</th>
                      <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Status</th>
                      <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Amount</th>
                      <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Date</th>
                      <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {sorted.map((s) => (
                      <tr key={s.id} className="hover:bg-zinc-800/50">
                        <td className="px-5 py-3 font-mono text-xs font-medium text-zinc-100">{s.id}</td>
                        <td className="px-5 py-3 text-zinc-400">{s.customer}</td>
                        <td className="px-5 py-3 text-zinc-400">{s.origin} → {s.destination}</td>
                        <td className="px-5 py-3"><StatusBadge status={s.status} /></td>
                        <td className="px-5 py-3 text-zinc-300">{formatCurrency(s.amount)}</td>
                        <td className="px-5 py-3 text-zinc-400">{formatDate(s.createdAt)}</td>
                        <td className="px-5 py-3">
                          <Link to={`/shipments/${s.id}`} className="inline-flex rounded-md border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-200 hover:bg-zinc-700">View</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

export default DriverDetails;