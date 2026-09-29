import { useParams, Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";
import DetailRow from "../components/DetailRow";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { getShipmentById, getShipmentTimeline } from "../services/shipmentService";
import { formatCurrency, formatDate } from "../utils/format";

function ShipmentDetails() {
  const { id } = useParams();
  const shipment = getShipmentById(id);

  // Not found state
  if (!shipment) {
    return (
      <div>
        <Link
          to="/shipments"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-blue-400 hover:text-blue-300"
        >
          ← Back to Shipments
        </Link>

        <PageHeader title="Shipment Not Found" description="The shipment you are looking for does not exist." />

        <Card>
          <p className="text-sm text-zinc-400">
            No shipment was found with ID: <span className="font-mono font-medium text-zinc-100">{id}</span>
          </p>
          <div className="mt-4">
            <Link to="/shipments">
              <Button variant="secondary">Back to Shipments</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  // Timeline derived from status
  const timeline = getShipmentTimeline(shipment);

  const paymentBadgeTone =
    shipment.paymentStatus === "Paid"
      ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/20"
      : shipment.paymentStatus === "Partial"
        ? "bg-amber-500/15 text-amber-300 border-amber-500/20"
        : shipment.paymentStatus === "Refunded"
          ? "bg-zinc-700 text-zinc-300 border-zinc-600"
          : "bg-amber-500/15 text-amber-300 border-amber-500/20";

  return (
    <div>
      <Link
        to="/shipments"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-blue-400 hover:text-blue-300"
      >
        ← Back to Shipments
      </Link>

      <PageHeader
        title={`Shipment ${shipment.id}`}
        description={`${shipment.origin} → ${shipment.destination} · ${shipment.customer}`}
        action={<StatusBadge status={shipment.status} />}
      />

      {/* Top summary card */}
      <Card padding="p-0" className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-zinc-800 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Shipment ID</p>
            <p className="mt-1 font-mono text-lg font-semibold text-zinc-50">{shipment.id}</p>
            <p className="mt-1 text-sm text-zinc-400">
              {shipment.customerId} · {shipment.customer}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-zinc-500">Amount</p>
              <p className="text-lg font-semibold text-zinc-50">{formatCurrency(shipment.amount)}</p>
              <span className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${paymentBadgeTone}`}>
                {shipment.paymentStatus}
              </span>
            </div>
          </div>
        </div>

        <div className="grid gap-0 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-zinc-800">
          <div className="p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Current location</p>
            <p className="mt-1 text-sm font-medium text-zinc-100">{shipment.currentLocation}</p>
            <p className="mt-1 text-xs text-zinc-500">Expected {formatDate(shipment.expectedDeliveryDate)}</p>
          </div>
          <div className="p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Route</p>
            <p className="mt-1 text-sm font-medium text-zinc-100">
              {shipment.origin} → {shipment.destination}
            </p>
            <p className="mt-1 text-xs text-zinc-500">Created {formatDate(shipment.createdAt)}</p>
          </div>
          <div className="p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Assignment</p>
            <p className="mt-1 text-sm font-medium text-zinc-100">{shipment.driver || "Unassigned"}</p>
            <p className="mt-1 text-xs text-zinc-500">{shipment.vehicle || "No vehicle"}</p>
          </div>
        </div>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Left: details */}
        <div className="space-y-6 lg:col-span-2">
          {/* Shipment Information */}
          <Card>
            <h2 className="text-sm font-semibold text-zinc-100">Shipment Information</h2>
            <div className="mt-3">
              <DetailRow label="Shipment ID">{shipment.id}</DetailRow>
              <DetailRow label="Customer">
                {shipment.customer} <span className="text-zinc-500">· {shipment.customerId}</span>
              </DetailRow>
              <DetailRow label="Origin">{shipment.origin}</DetailRow>
              <DetailRow label="Destination">{shipment.destination}</DetailRow>
              <DetailRow label="Amount">{formatCurrency(shipment.amount)}</DetailRow>
              <DetailRow label="Created">{formatDate(shipment.createdAt)}</DetailRow>
              <DetailRow label="Pickup date">{formatDate(shipment.pickupDate)}</DetailRow>
              <DetailRow label="Expected delivery">{formatDate(shipment.expectedDeliveryDate)}</DetailRow>
              <DetailRow label="Actual delivery">{formatDate(shipment.actualDeliveryDate)}</DetailRow>
            </div>
          </Card>

          {/* Assignment + Tracking */}
          <div className="grid gap-6 sm:grid-cols-2">
            <Card>
              <h2 className="text-sm font-semibold text-zinc-100">Assignment</h2>
              <div className="mt-3">
                <DetailRow label="Driver">
                  {shipment.driver ? (
                    <>
                      {shipment.driver} <span className="text-zinc-500">· {shipment.driverId}</span>
                    </>
                  ) : (
                    <span className="text-zinc-500">Unassigned</span>
                  )}
                </DetailRow>
                <DetailRow label="Vehicle">{shipment.vehicle || "—"}</DetailRow>
                <DetailRow label="Status">
                  {shipment.driver ? (
                    <span className="text-emerald-300">Assigned</span>
                  ) : (
                    <span className="text-amber-300">Awaiting assignment</span>
                  )}
                </DetailRow>
              </div>
            </Card>

            <Card>
              <h2 className="text-sm font-semibold text-zinc-100">Tracking</h2>
              <div className="mt-3">
                <DetailRow label="Current location">{shipment.currentLocation}</DetailRow>
                <DetailRow label="Status">
                  <StatusBadge status={shipment.status} />
                </DetailRow>
                <DetailRow label="Expected delivery">{formatDate(shipment.expectedDeliveryDate)}</DetailRow>
              </div>
            </Card>
          </div>

          {/* Payment Summary */}
          <Card>
            <h2 className="text-sm font-semibold text-zinc-100">Payment Summary</h2>
            <p className="mt-1 text-xs text-zinc-500">Full payments management lands in Phase 3</p>
            <div className="mt-3">
              <DetailRow label="Amount">{formatCurrency(shipment.amount)}</DetailRow>
              <DetailRow label="Payment status">
                <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${paymentBadgeTone}`}>
                  {shipment.paymentStatus}
                </span>
              </DetailRow>
              <DetailRow label="Customer">{shipment.customer}</DetailRow>
            </div>
          </Card>
        </div>

        {/* Right: timeline */}
        <div>
          <Card>
            <h2 className="text-sm font-semibold text-zinc-100">Shipment Timeline</h2>
            <p className="mt-1 text-xs text-zinc-500">Status-aware events for {shipment.id}</p>

            <div className="mt-6 relative">
              {/* vertical line */}
              <div className="absolute left-[7px] top-2 bottom-2 w-px bg-zinc-800" aria-hidden="true" />
              <div className="space-y-5">
                {timeline.map((event) => (
                  <div key={event.id} className="relative flex gap-3">
                    <span
                      className={`mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 ${
                        event.variant === "cancelled"
                          ? "border-zinc-500 bg-zinc-700"
                          : event.done
                            ? "border-blue-600 bg-blue-600"
                            : "border-zinc-600 bg-zinc-900"
                      }`}
                      aria-hidden="true"
                    />
                    <div className="min-w-0 flex-1 pb-1">
                      <p className={`text-sm font-medium ${event.done ? "text-zinc-100" : "text-zinc-400"}`}>{event.title}</p>
                      <p className="mt-1 text-xs leading-relaxed text-zinc-500">{event.description}</p>
                      {event.date && <p className="mt-1 text-xs text-zinc-600">{formatDate(event.date)}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default ShipmentDetails;
