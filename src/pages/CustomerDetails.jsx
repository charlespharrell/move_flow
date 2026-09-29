import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";
import DetailRow from "../components/DetailRow";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import StatCard from "../components/StatCard";
import Modal from "../components/ui/Modal";
import CustomerForm from "../components/CustomerForm";
import { getCustomerById, getCustomerShipments, getCustomerStats, updateCustomer, subscribe } from "../services/customerService";
import { formatCurrency, formatDate } from "../utils/format";
import { useToast } from "../components/ui/Toast";

function CustomerDetails() {
  const { customerId } = useParams();
  const [editOpen, setEditOpen] = useState(false);
  const [, forceUpdate] = useState(0);
  const { addToast } = useToast();
  const customer = getCustomerById(customerId);

  // Re-render when customers store changes (after edit)
  useEffect(() => {
    const unsub = subscribe(() => forceUpdate((v) => v + 1));
    return unsub;
  }, []);

  // Not found
  if (!customer) {
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

  const shipments = getCustomerShipments(customer.id);
  const stats = getCustomerStats(customer.id);

  // Recent shipments sorted by createdAt desc
  const sortedShipments = [...shipments].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

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
            <Button variant="secondary" size="md" onClick={() => setEditOpen(true)}>Edit Customer</Button>
          </div>
        }
      />

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Customer">
        <CustomerForm
          initialData={customer}
          onSubmit={(data) => {
            updateCustomer(customer.id, data);
            setEditOpen(false);
            addToast(`Customer ${data.businessName} updated`, "success");
          }}
          onCancel={() => setEditOpen(false)}
          submitLabel="Save Changes"
        />
      </Modal>

      {/* Stats */}
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
              {sortedShipments.slice(0, 3).map((s) => (
                <div key={s.id} className="flex gap-2 text-xs">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                  <div>
                    <p className="text-zinc-300">{s.id} · {s.status} — {s.origin} → {s.destination}</p>
                    <p className="text-zinc-500">{formatDate(s.createdAt)}</p>
                  </div>
                </div>
              ))}
              {sortedShipments.length === 0 && <p className="text-sm text-zinc-500">No activity yet.</p>}
            </div>
          </Card>
        </div>

        {/* Right: shipment history */}
        <div className="lg:col-span-2">
          <Card padding="p-0" className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
              <div>
                <h2 className="text-sm font-semibold text-zinc-100">Shipment History</h2>
                <p className="text-xs text-zinc-500">{shipments.length} {shipments.length === 1 ? "shipment" : "shipments"} for this customer</p>
              </div>
              {shipments.length > 0 && <span className="text-xs text-zinc-500">{formatCurrency(stats.totalSpending)} total</span>}
            </div>

            {shipments.length === 0 ? (
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
                    {sortedShipments.map((s) => (
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
