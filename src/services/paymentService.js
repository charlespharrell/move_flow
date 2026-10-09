// Payment service — MoveFlow API-backed (PostgreSQL is the source of truth).
// The Payments list/detail pages read through the API; payment state
// synchronization (Shipment.paymentStatus) is handled entirely server-side.
import { api } from "./api.js";
import { getDashboard } from "./dashboardService.js";

const BASE = "/payments";

/**
 * List payments server-side: the API resolves pagination, search, status and
 * payment-method filtering, so the page never holds more than one page.
 *
 * @returns {Promise<{payments: object[], pagination: {page:number, limit:number, total:number, totalPages:number}>}>}
 */
export async function listPayments({
  page = 1,
  limit = 8,
  search = "",
  status,
  paymentMethod,
  sort,
  order,
} = {}) {
  const query = api.query({
    page,
    limit,
    search: search.trim() || undefined,
    status,
    paymentMethod,
    sort,
    order,
  });
  return api.get(`${BASE}${query}`);
}

/**
 * Fetch one payment plus its shipment/customer relationship summary.
 *
 * @returns {Promise<{payment: object, related: {shipment: object|null, customer: object|null}}|null>}
 *   null when the API reports the payment does not exist (404).
 */
export async function getPayment(id) {
  try {
    const data = await api.get(`${BASE}/${encodeURIComponent(id)}`);
    return { payment: data?.payment ?? null, related: data?.related ?? null };
  } catch (error) {
    if (error?.status === 404) return null;
    throw error;
  }
}

/**
 * Summary-card aggregates (total/paid/pending/failed/refunded + revenue).
 * There is no dedicated payments stats endpoint, so this reuses the dashboard
 * summary — PostgreSQL GROUP BY payment status plus the paid-revenue sum — and
 * maps it to the shape the Payments cards render.
 *
 * @returns {Promise<{total:number, paid:number, pending:number, failed:number, refunded:number, totalRevenue:number}|null>}
 */
export async function getPaymentStats() {
  const summary = (await getDashboard())?.summary;
  if (!summary) return null;

  const paid = summary.paidPayments ?? 0;
  const pending = summary.pendingPayments ?? 0;
  const failed = summary.failedPayments ?? 0;
  const refunded = summary.refundedPayments ?? 0;

  return {
    total: paid + pending + failed + refunded,
    paid,
    pending,
    failed,
    refunded,
    totalRevenue: summary.totalRevenue ?? 0,
  };
}
