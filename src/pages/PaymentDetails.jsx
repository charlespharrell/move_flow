import { Link, useParams } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";
import DetailRow from "../components/DetailRow";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { getPaymentById } from "../services/paymentService";
import { getShipmentById } from "../services/shipmentService";
import { getCustomerById } from "../services/customerService";
import { formatCurrency, formatDate } from "../utils/format";

function PaymentDetails() {
  const { paymentId } = useParams();
  const payment = getPaymentById(paymentId);

  if (!payment) {
    return (
      <div>
        <Link to="/payments" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-blue-400 hover:text-blue-300">
          ← Back to Payments
        </Link>
        <PageHeader title="Payment Not Found" description="The payment you are looking for does not exist." />
        <Card>
          <p className="text-sm text-zinc-400">
            No payment found with ID: <span className="font-mono font-medium text-zinc-100">{paymentId}</span>
          </p>
          <div className="mt-4">
            <Link to="/payments"><Button variant="secondary">Back to Payments</Button></Link>
          </div>
        </Card>
      </div>
    );
  }

  const shipment = getShipmentById(payment.shipmentId);
  const customer = getCustomerById(payment.customerId);

  return (
    <div>
      <Link to="/payments" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-blue-400 hover:text-blue-300">
        ← Back to Payments
      </Link>

      <PageHeader
        title={payment.id}
        description={`${payment.transactionReference} · ${payment.paymentMethod}`}
        action={<StatusBadge status={payment.status} />}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: payment + customer */}
        <div className="space-y-6">
          <Card>
            <h2 className="text-sm font-semibold text-zinc-100">Payment Information</h2>
            <div className="mt-3">
              <DetailRow label="Payment ID"><span className="font-mono">{payment.id}</span></DetailRow>
              <DetailRow label="Amount">{formatCurrency(payment.amount)}</DetailRow>
              <DetailRow label="Status"><StatusBadge status={payment.status} /></DetailRow>
              <DetailRow label="Method">{payment.paymentMethod}</DetailRow>
              <DetailRow label="Reference"><span className="font-mono text-xs">{payment.transactionReference}</span></DetailRow>
              <DetailRow label="Created">{formatDate(payment.createdAt)}</DetailRow>
              <DetailRow label="Paid">{formatDate(payment.paidAt)}</DetailRow>
              {payment.refundedAt && <DetailRow label="Refunded">{formatDate(payment.refundedAt)}</DetailRow>}
            </div>
          </Card>

          <Card>
            <h2 className="text-sm font-semibold text-zinc-100">Customer Information</h2>
            {customer ? (
              <div className="mt-3">
                <DetailRow label="Name">
                  <Link to={`/customers/${customer.id}`} className="text-blue-400 hover:text-blue-300">
                    {customer.businessName}
                  </Link>
                </DetailRow>
                <DetailRow label="Email">{customer.email}</DetailRow>
                <DetailRow label="Phone">{customer.phone}</DetailRow>
                <DetailRow label="ID"><span className="font-mono text-xs">{customer.id}</span></DetailRow>
                <div className="mt-3">
                  <Link to={`/customers/${customer.id}`} className="text-xs font-medium text-blue-400 hover:text-blue-300">
                    View customer →
                  </Link>
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm text-zinc-500">Customer not found.</p>
            )}
          </Card>
        </div>

        {/* Right: shipment */}
        <div className="lg:col-span-2">
          <Card>
            <h2 className="text-sm font-semibold text-zinc-100">Shipment Information</h2>
            {shipment ? (
              <div className="mt-3">
                <DetailRow label="Shipment">
                  <Link to={`/shipments/${shipment.id}`} className="font-mono text-blue-400 hover:text-blue-300">
                    {shipment.id}
                  </Link>
                </DetailRow>
                <DetailRow label="Customer">{shipment.customer}</DetailRow>
                <DetailRow label="Route">{shipment.origin} → {shipment.destination}</DetailRow>
                <DetailRow label="Status"><StatusBadge status={shipment.status} /></DetailRow>
                <DetailRow label="Amount">{formatCurrency(shipment.amount)}</DetailRow>
                <DetailRow label="Current location">{shipment.currentLocation}</DetailRow>
                <div className="mt-3">
                  <Link to={`/shipments/${shipment.id}`} className="text-xs font-medium text-blue-400 hover:text-blue-300">
                    View shipment →
                  </Link>
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm text-zinc-500">Shipment not found.</p>
            )}
          </Card>

          {/* Amount summary */}
          <Card className="mt-6">
            <h2 className="text-sm font-semibold text-zinc-100">Summary</h2>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-sm text-zinc-400">Shipment amount</span>
              <span className="text-sm font-semibold text-zinc-100">{shipment ? formatCurrency(shipment.amount) : "—"}</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-sm text-zinc-400">Payment amount</span>
              <span className="text-sm font-semibold text-zinc-100">{formatCurrency(payment.amount)}</span>
            </div>
            <div className="mt-3 border-t border-zinc-800 pt-3 flex items-center justify-between">
              <span className="text-xs text-zinc-500">Status</span>
              <StatusBadge status={payment.status} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default PaymentDetails;
