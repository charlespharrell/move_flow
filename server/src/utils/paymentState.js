/**
 * Shared payment -> Shipment.paymentStatus derivation.
 *
 * The Shipment model carries a denormalised PaymentState that must always
 * reflect its related Payment rows. Payments and Shipments both recompute it
 * through this single function inside their own transactions, so there is only
 * ever one business rule.
 *
 * Order matters (deterministic, first match wins):
 * - no payments                -> PENDING
 * - every payment REFUNDED     -> REFUNDED
 * - every payment PAID         -> PAID
 * - at least one payment PAID  -> PARTIAL
 * - any payment FAILED         -> FAILED
 * - otherwise                  -> PENDING
 *
 * `payments` is a list of rows exposing `status` (PaymentStatus members). The
 * returned state is always a PaymentState member (a superset of PaymentStatus:
 * it adds PARTIAL, which Payment rows can never hold themselves).
 */
export function derivePaymentState(payments) {
  const states = payments.map((payment) => payment.status)
  if (states.length === 0) return 'PENDING'
  if (states.every((state) => state === 'REFUNDED')) return 'REFUNDED'
  if (states.every((state) => state === 'PAID')) return 'PAID'
  if (states.some((state) => state === 'PAID')) return 'PARTIAL'
  if (states.some((state) => state === 'FAILED')) return 'FAILED'
  return 'PENDING'
}