// Payment service — lightweight mock, aligned with shipment/customer IDs
import payments from "../data/payments";

export function getPayments() {
  return payments;
}

export function getPaymentById(id) {
  return payments.find((p) => p.id === id) || null;
}

export function getPaymentsByCustomerId(customerId) {
  return payments.filter((p) => p.customerId === customerId);
}

export function getPaymentByShipmentId(shipmentId) {
  return payments.find((p) => p.shipmentId === shipmentId) || null;
}

export function getPaymentStats() {
  const total = payments.length;
  const paid = payments.filter((p) => p.status === "Paid").length;
  const pending = payments.filter((p) => p.status === "Pending").length;
  const failed = payments.filter((p) => p.status === "Failed").length;
  const refunded = payments.filter((p) => p.status === "Refunded").length;
  const totalRevenue = payments
    .filter((p) => p.status === "Paid")
    .reduce((sum, p) => sum + p.amount, 0);
  return { total, paid, pending, failed, refunded, totalRevenue };
}
