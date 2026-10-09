import prisma from '../lib/prisma.js'
import AppError from '../utils/AppError.js'
import { humanizeEnum, toDateOnly } from '../utils/enums.js'
import { derivePaymentState } from '../utils/paymentState.js'

const PAYMENT_PREFIX = 'PAY-'

// Fields serialized/already selected on the payment row. The customer
// relation is loaded so list rows carry the business name the UI renders.
const PAYMENT_SELECT = {
  id: true,
  shipmentId: true,
  customerId: true,
  amount: true,
  paymentMethod: true,
  status: true,
  transactionReference: true,
  createdAt: true,
  paidAt: true,
  refundedAt: true,
  updatedAt: true,
  customer: { select: { businessName: true } },
}

const SHIPMENT_SUMMARY_SELECT = {
  id: true,
  customerId: true,
  origin: true,
  destination: true,
  status: true,
  amount: true,
  currentLocation: true,
  customer: { select: { businessName: true } },
}

/** Frontend-friendly payment DTO — mirrors the shape of src/data/payments.js. */
export function serializePayment(payment) {
  if (!payment) return null
  return {
    id: payment.id,
    shipmentId: payment.shipmentId,
    customerId: payment.customerId,
    customer: payment.customer?.businessName ?? null,
    amount: Number(payment.amount),
    paymentMethod: humanizeEnum(payment.paymentMethod),
    status: humanizeEnum(payment.status),
    transactionReference: payment.transactionReference,
    createdAt: toDateOnly(payment.createdAt),
    paidAt: toDateOnly(payment.paidAt),
    refundedAt: toDateOnly(payment.refundedAt),
    updatedAt: toDateOnly(payment.updatedAt),
  }
}

function serializeShipmentSummary(shipment) {
  if (!shipment) return null
  return {
    id: shipment.id,
    customer: shipment.customer?.businessName ?? null,
    origin: shipment.origin,
    destination: shipment.destination,
    status: humanizeEnum(shipment.status),
    amount: Number(shipment.amount),
    currentLocation: shipment.currentLocation,
  }
}

/**
 * Payment.id has no default in the schema, so IDs are generated here using the
 * product's PAY-001 convention. Retries on a primary-key collision so two
 * simultaneous creates cannot persist the same id.
 */
async function nextPaymentId() {
  const payments = await prisma.payment.findMany({ select: { id: true } })
  const highest = payments.reduce((max, payment) => {
    if (!payment.id.startsWith(PAYMENT_PREFIX)) return max
    const numeric = Number.parseInt(payment.id.slice(PAYMENT_PREFIX.length), 10)
    return Number.isInteger(numeric) && numeric > max ? numeric : max
  }, 0)

  return `${PAYMENT_PREFIX}${String(highest + 1).padStart(3, '0')}`
}

function toDateColumn(value) {
  return value ? new Date(`${value}T00:00:00.000Z`) : null
}

/**
 * Verifies a Payment reference pair: both the shipment and the customer must
 * exist, and the shipment must actually belong to that customer. A payment can
 * never attach Customer A to a shipment owned by Customer B.
 */
async function assertPaymentRefs(shipmentId, customerId) {
  const [shipment, customer] = await Promise.all([
    prisma.shipment.findUnique({ where: { id: shipmentId }, select: { id: true, customerId: true } }),
    prisma.customer.findUnique({ where: { id: customerId }, select: { id: true } }),
  ])
  if (!shipment) throw AppError.badRequest('Shipment does not exist')
  if (!customer) throw AppError.badRequest('Customer does not exist')
  if (shipment.customerId !== customerId) {
    throw AppError.badRequest('Payment customer does not match the shipment customer')
  }
}

/**
 * Recomputes a shipment's denormalised paymentStatus from its Payment rows.
 * Runs inside the caller's transaction (tx client) so a payment mutation and
 * its shipment state sync commit or roll back together — a payment row can
 * never exist while shipment.paymentStatus is stale.
 */
async function recomputeShipmentPaymentState(tx, shipmentId) {
  const payments = await tx.payment.findMany({
    where: { shipmentId },
    select: { status: true },
  })
  await tx.shipment.update({
    where: { id: shipmentId },
    data: { paymentStatus: derivePaymentState(payments) },
  })
}

export async function listPayments({ page, limit, search, status, paymentMethod, shipment, customer, sort, order }) {
  const where = {}

  if (search) {
    // Insensitive partial match across the fields the Payments UI searches on
    // (payment id, shipment id, customer name, customer id, reference).
    where.OR = [
      { id: { contains: search, mode: 'insensitive' } },
      { shipmentId: { contains: search, mode: 'insensitive' } },
      { customerId: { contains: search, mode: 'insensitive' } },
      { transactionReference: { contains: search, mode: 'insensitive' } },
      { customer: { businessName: { contains: search, mode: 'insensitive' } } },
    ]
  }
  if (status) where.status = status
  if (paymentMethod) where.paymentMethod = paymentMethod
  if (shipment) where.shipmentId = shipment
  if (customer) where.customerId = customer

  const [total, payments] = await Promise.all([
    prisma.payment.count({ where }),
    prisma.payment.findMany({
      where,
      orderBy: { [sort]: order },
      skip: (page - 1) * limit,
      take: limit,
      select: PAYMENT_SELECT,
    }),
  ])

  return {
    payments: payments.map(serializePayment),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  }
}

export async function getPaymentById(id) {
  const payment = await prisma.payment.findUnique({ where: { id }, select: PAYMENT_SELECT })
  if (!payment) throw AppError.notFound('Payment not found')
  return serializePayment(payment)
}

/**
 * Read-only shipment/customer summary for the PaymentDetails page — exactly
 * what the page currently renders via getShipmentById/getCustomerById.
 */
export async function getPaymentRelationship(id) {
  const payment = await prisma.payment.findUnique({ where: { id }, select: { shipmentId: true, customerId: true } })
  if (!payment) throw AppError.notFound('Payment not found')

  const [shipment, customer] = await Promise.all([
    prisma.shipment.findUnique({ where: { id: payment.shipmentId }, select: SHIPMENT_SUMMARY_SELECT }),
    prisma.customer.findUnique({
      where: { id: payment.customerId },
      select: { id: true, businessName: true, email: true, phone: true },
    }),
  ])

  return {
    shipment: serializeShipmentSummary(shipment),
    customer: customer
      ? {
          id: customer.id,
          businessName: customer.businessName,
          email: customer.email,
          phone: customer.phone,
        }
      : null,
  }
}

export async function createPayment(input, actorId = null) {
  await assertPaymentRefs(input.shipmentId, input.customerId)

  const data = {
    shipmentId: input.shipmentId.trim(),
    customerId: input.customerId.trim(),
    amount: input.amount,
    paymentMethod: input.paymentMethod,
    status: input.status ?? 'PENDING',
    transactionReference: input.transactionReference.trim(),
    paidAt: toDateColumn(input.paidAt),
    refundedAt: toDateColumn(input.refundedAt),
  }

  const MAX_ATTEMPTS = 3
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const id = await nextPaymentId()
      await prisma.$transaction(async (tx) => {
        await tx.payment.create({ data: { id, ...data } })
        // Keep Shipment.paymentStatus in sync in the SAME transaction.
        await recomputeShipmentPaymentState(tx, data.shipmentId)
        await tx.activity.create({
          data: {
            type: 'PAYMENT',
            message: `Payment ${id} of ${data.amount} received for shipment ${data.shipmentId}`,
            entityType: 'PAYMENT',
            entityId: id,
            userId: actorId,
          },
        })
      })
      return getPaymentById(id)
    } catch (error) {
      if (error?.code === 'P2002') {
        // A generated payment id losing a race retries; a duplicate reference
        // is a real conflict.
        const target = Array.isArray(error.meta?.target) ? error.meta.target.join(',') : String(error.meta?.target ?? '')
        if (target.includes('transactionReference')) {
          throw AppError.conflict('A payment with this transaction reference already exists')
        }
        if (attempt < MAX_ATTEMPTS) continue
      }
      throw error
    }
  }

  throw AppError.conflict('Could not allocate a unique payment ID')
}

export async function updatePayment(id, input, actorId = null) {
  const existing = await prisma.payment.findUnique({ where: { id }, select: PAYMENT_SELECT })
  if (!existing) throw AppError.notFound('Payment not found')

  const data = {}
  let shipmentChanged = false

  if (input.shipmentId !== undefined && input.shipmentId !== existing.shipmentId) {
    data.shipmentId = input.shipmentId.trim()
    shipmentChanged = true
  }
  if (input.customerId !== undefined && input.customerId !== existing.customerId) {
    data.customerId = input.customerId.trim()
  }
  if (input.amount !== undefined) data.amount = input.amount
  if (input.paymentMethod !== undefined) data.paymentMethod = input.paymentMethod
  if (input.status !== undefined) data.status = input.status
  if (input.transactionReference !== undefined) data.transactionReference = input.transactionReference.trim()
  if (input.paidAt !== undefined) data.paidAt = toDateColumn(input.paidAt)
  if (input.refundedAt !== undefined) data.refundedAt = toDateColumn(input.refundedAt)

  // No-op patch (every provided field matched the stored value).
  if (Object.keys(data).length === 0) return serializePayment(existing)

  // The pair must still be consistent after the change: the final shipment and
  // customer must exist and match each other. Pre-validating inside the
  // transaction keeps the check race-free with the mutation.
  const finalShipmentId = data.shipmentId ?? existing.shipmentId
  const finalCustomerId = data.customerId ?? existing.customerId

  await prisma.$transaction(async (tx) => {
    const shipment = await tx.shipment.findUnique({
      where: { id: finalShipmentId },
      select: { id: true, customerId: true },
    })
    if (!shipment) throw AppError.badRequest('Shipment does not exist')
    const customer = await tx.customer.findUnique({ where: { id: finalCustomerId }, select: { id: true } })
    if (!customer) throw AppError.badRequest('Customer does not exist')
    if (shipment.customerId !== finalCustomerId) {
      throw AppError.badRequest('Payment customer does not match the shipment customer')
    }

    await tx.payment.update({ where: { id }, data })

    // If the payment moved between shipments, re-derive BOTH the old and new
    // shipment states — neither may be left stale.
    if (shipmentChanged) {
      await recomputeShipmentPaymentState(tx, existing.shipmentId)
    }
    await recomputeShipmentPaymentState(tx, finalShipmentId)

    await tx.activity.create({
      data: {
        type: 'PAYMENT',
        message: `Payment ${id} updated for shipment ${finalShipmentId}`,
        entityType: 'PAYMENT',
        entityId: id,
        userId: actorId,
      },
    })
  })

  return getPaymentById(id)
}

/**
 * Hard delete. Payments are leaf records (shipments/customers reference them
 * only via count), so removal is safe; the affected shipment's paymentStatus is
 * re-derived in the same transaction. No activity row is written on delete
 * because ActivityType has no DELETED member.
 */
export async function deletePayment(id) {
  const existing = await prisma.payment.findUnique({ where: { id } })
  if (!existing) throw AppError.notFound('Payment not found')

  await prisma.$transaction(async (tx) => {
    await tx.payment.delete({ where: { id } })
    await recomputeShipmentPaymentState(tx, existing.shipmentId)
  })

  return { id }
}