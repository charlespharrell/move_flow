import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";
import DetailRow from "../components/DetailRow";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import StatCard from "../components/StatCard";
import Modal from "../components/ui/Modal";
import CustomerForm from "../components/CustomerForm";
import { ErrorState, LoadingState } from "../components/ui/States";
import { getCustomer, updateCustomer, deleteCustomer } from "../services/customerService";
import { listShipments } from "../services/shipmentService";
import { useAuth } from "../hooks/useAuth";
import { formatCurrency, formatDate } from "../utils/format";
import { describeApiError } from "../utils/apiError";
import { useToast } from "../components/ui/Toast";

const FORBIDDEN = "You do not have permission to manage customers.";
const EDITABLE_FIELDS = ["businessName", "contactName", "email", "phone", "status", "dateJoined"];

function CustomerDetails() {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const { role } = useAuth();
  // Administrator and Operations manage customers; Finance reads only.
  const canManage = role === "Administrator" || role === "Operations";
  const { addToast } = useToast();

  const [reloadKey, setReloadKey] = useState(0);

  // Last completed fetch, keyed by the request it answered — a changed key
  // reads as "loading" without any setState inside the fetch effect.
  const queryKey = `${customerId}|${reloadKey}`;
  const [completed, setCompleted] = useState({ key: null, customer: null, related: null, error: null });
  // Shipment history is a separate query so a shipments failure renders inside
  // the history card instead of taking down the whole page.
  const [shipmentsCompleted, setShipmentsCompleted] = useState({ key: null, shipments: null, error: null });

  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getCustomer(customerId)
      .then((result) => {
        if (cancelled) return;
        if (!result?.customer) {
          setCompleted({ key: queryKey, customer: null, related: null, error: { status: 404 } });
        } else {
          setCompleted({ key: queryKey, customer: result.customer, related: result.related, error: null });
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setCompleted({ key: queryKey, customer: null, related: null, error: err });
      });

    return () => {
      cancelled = true;
    };
  }, [queryKey, customerId, reloadKey]);

  // Real shipment history from the Shipments API, newest first (server-side
  // sort), limited to one page of history rows.
  useEffect(() => {
    let cancelled = false;

    listShipments({ customer: customerId, limit: 100 })
      .then((result) => {
        if (cancelled) return;
        setShipmentsCompleted({ key: queryKey, shipments: result?.shipments ?? [], error: null });
      })
      .catch((err) => {
        if (cancelled) return;
        setShipmentsCompleted({ key: queryKey, shipments: null, error: err });
      });

    return () => {
      cancelled = true;
    };
  }, [queryKey, customerId, reloadKey]);

  const loading = completed.key !== queryKey;
  const error = loading ? null : completed.error;
  const customer = completed.customer;
  const related = completed.related;

  const shipmentsLoading = shipmentsCompleted.key !== queryKey;
  const shipmentsError = shipmentsLoading ? null : shipmentsCompleted.error;
  const shipments = shipmentsCompleted.shipments ?? [];

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  async function handleUpdate(formData) {
    // Only send the fields that actually changed.
    const patch = {};
    for (const field of EDITABLE_FIELDS) {
      const next = String(formData[field] ?? "").trim();
      const prev = String(customer[field] ?? "").trim();
      if (next !== prev) patch[field] = next;
    }
    if (Object.keys(patch).length === 0) {
      setEditOpen(false);
      addToast("No changes to save", "info");
      return;
    }

    setSaving(true);
    try {
      const updated = await updateCustomer(customerId, patch);
      setCompleted((prev) => ({ ...prev, customer: updated ?? prev.customer }));
      setEditOpen(false);
      addToast(`Customer ${updated?.businessName ?? customer.businessName} updated`, "success");
    } catch (err) {
      addToast(describeApiError(err, { forbidden: FORBIDDEN }), "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteCustomer(customerId);
      setDeleteOpen(false);
      addToast(`Customer ${customer.businessName} deleted`, "success");
      navigate("/customers");
    } catch (err) {
      addToast(describeApiError(err, { forbidden: FORBIDDEN, fallback: "Unable to delete this customer." }), "error");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div>
        <Link to="/customers" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-blue-400 hover:text-blue-300">
          ← Back to Customers
        </Link>
        <LoadingState label="Loading customer…" />
      </div>
    );
  }

  if (error?.status === 404) {
    return (
      <div>
        <Link to="/customers" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-blue-400 hover:text-blue-300">
          ← Back to Customers
        </Link>
        <PageHeader title="Customer Not Found" description="The customer you are looking for does not exist." />
        <Card>
          <p className="text-sm text-zinc-400">
            No customer found with ID: <span className="font-mono font-medium text-zinc-100">{customerId}</span>
          </p>
          <div className="mt-4">
            <Link to="/customers"><Button variant="secondary">Back to Customers</Button></Link>
          </div>
        </Card>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div>
        <Link to="/customers" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-blue-400 hover:text-blue-300">
          ← Back to Customers
        </Link>
        <ErrorState
          title="Unable to load customer"
          description={describeApiError(error, { forbidden: "You do not have permission to view customers.", fallback: "Unable to load this customer." })}
          onRetry={reload}
        />
      </div>
    );
  }

  // Shipment relationship summary (counts + spending) aggregated in PostgreSQL
  // by the customer API, with safe defaults if the response omits it.
  const stats = related?.shipments ?? { total: 0, active: 0, delivered: 0, totalSpending: 0 };

  return (
    <div>
      <Link to="/customers" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-blue-400 hover:text-blue-300">
        ← Back to Customers
      </Link>

      <PageHeader
        title={customer.businessName}
        description={`${customer.id} · ${customer.contactName}`}
        action={
          <div className="flex items-center gap-2">
            <StatusBadge status={customer.status} />
            {canManage && (
              <>
                <Button variant="secondary" size="md" onClick={() => setEditOpen(true)}>Edit Customer</Button>
                <Button variant="secondary" size="md" onClick={() => setDeleteOpen(true)}>Delete Customer</Button>
              </>
            )}
          </div>
        }
      />

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Customer">
        <CustomerForm
          initialData={customer}
          onSubmit={handleUpdate}
          onCancel={() => setEditOpen(false)}
          submitting={saving}
          submitLabel="Save Changes"
        />
      </Modal>

      {canManage && (
        <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete Customer">
          <p className="text-sm text-zinc-300">
            Delete <span className="font-medium text-zinc-100">{customer.businessName}</span>{" "}
            (<span className="font-mono">{customer.id}</span>)? This cannot be undone.
          </p>
          <p className="mt-2 text-xs text-zinc-500">
            Customers with shipment or payment history cannot be deleted.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeleteOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete Customer"}
            </Button>
          </div>
        </Modal>
      )}

      {/* Stats — shipment aggregates from the API */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Shipments" value={stats.total} subtitle="All time" />
        <StatCard title="Active Shipments" value={stats.active} subtitle="Assigned + In Transit" accent="text-blue-400" />
        <StatCard title="Delivered" value={stats.delivered} subtitle="Completed deliveries" accent="text-emerald-400" />
        <StatCard title="Total Spending" value={formatCurrency(stats.totalSpending)} subtitle="Across all shipments" accent="text-violet-400" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Left: customer info */}
        <div className="space-y-6 lg:col-span-1">
          <Card>
            <h2 className="text-sm font-semibold text-zinc-100">Customer Information</h2>
            <div className="mt-3">
              <DetailRow label="Business name">{customer.businessName}</DetailRow>
              <DetailRow label="Contact person">{customer.contactName}</DetailRow>
              <DetailRow label="Email">{customer.email}</DetailRow>
              <DetailRow label="Phone">{customer.phone}</DetailRow>
              <DetailRow label="Account status"><StatusBadge status={customer.status} /></DetailRow>
              <DetailRow label="Date joined">{formatDate(customer.dateJoined)}</DetailRow>
              <DetailRow label="Customer ID"><span className="font-mono">{customer.id}</span></DetailRow>
            </div>
          </Card>

          {/* Quick summary / activity placeholder */}
          <Card>
            <h2 className="text-sm font-semibold text-zinc-100">Recent activity</h2>
            <p className="mt-1 text-xs text-zinc-500">Derived from shipment history</p>
            <div className="mt-4 space-y-3">
              {shipmentsLoading ? (
                <LoadingState label="Loading activity…" />
              ) : shipmentsError ? (
                <p className="text-sm text-zinc-500">Activity could not be loaded.</p>
              ) : shipments.length === 0 ? (
                <p className="text-sm text-zinc-500">No activity yet.</p>
              ) : (
                shipments.slice(0, 3).map((s) => (
                  <div key={s.id} className="flex gap-2 text-xs">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                    <div>
                      <p className="text-zinc-300">{s.id} · {s.status} — {s.origin} → {s.destination}</p>
                      <p className="text-zinc-500">{formatDate(s.createdAt)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Right: shipment history */}
        <div className="lg:col-span-2">
          <Card padding="p-0" className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
              <div>
                <h2 className="text-sm font-semibold text-zinc-100">Shipment History</h2>
                <p className="text-xs text-zinc-500">{stats.total} {stats.total === 1 ? "shipment" : "shipments"} for this customer</p>
              </div>
              {stats.total > 0 && <span className="text-xs text-zinc-500">{formatCurrency(stats.totalSpending)} total</span>}
            </div>

            {shipmentsLoading ? (
              <LoadingState label="Loading shipments…" />
            ) : shipmentsError ? (
              <ErrorState
                title="Unable to load shipments"
                description={describeApiError(shipmentsError, { forbidden: "You do not have permission to view shipments.", fallback: "Unable to load this customer's shipments." })}
                onRetry={reload}
              />
            ) : shipments.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p className="text-sm text-zinc-500">No shipments for this customer yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="border-b border-zinc-800">
                    <tr>
                      <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Shipment</th>
                      <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Route</th>
                      <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Driver</th>
                      <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Status</th>
                      <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Amount</th>
                      <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Date</th>
                      <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {shipments.map((s) => (
                      <tr key={s.id} className="hover:bg-zinc-800/50">
                        <td className="px-5 py-3 font-mono text-xs font-medium text-zinc-100">{s.id}</td>
                        <td className="px-5 py-3 text-zinc-400">{s.origin} → {s.destination}</td>
                        <td className="px-5 py-3 text-zinc-400">{s.driver || "Unassigned"}</td>
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

export default CustomerDetails;
