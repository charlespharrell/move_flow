import prisma from '../lib/prisma.js'
import AppError from '../utils/AppError.js'
import { humanizeEnum, toDateOnly } from '../utils/enums.js'
import { derivePaymentState } from '../utils/paymentState.js'
import { STATUS_REQUIRES_DRIVER } from '../validators/shipment.validator.js'

const SHIPMENT_PREFIX = 'SH-'

// Fields serialized out to the API. Customer/driver relations are selected so
// the shipment rows carry the display names the existing UI already renders
// without loading the full relation objects.
const SHIPMENT_SELECT = {
  id: true,
  customerId: true,
  driverId: true,
  vehicle: true,
  status: true,
  paymentStatus: true,
  origin: true,
  destination: true,
  currentLocation: true,
  amount: true,
  createdAt: true,
  pickupDate: true,
  expectedDeliveryDate: true,
  actualDeliveryDate: true,
  updatedAt: true,
  customer: { select: { businessName: true } },
  driver: { select: { name: true } },
}

/** Frontend-friendly shipment DTO — mirrors the shape of src/data/shipments.js. */
export function serializeShipment(shipment) {
  if (!shipment) return null
  return {
    id: shipment.id,
    customerId: shipment.customerId,
    customer: shipment.customer?.businessName ?? null,
    driverId: shipment.driverId,
    driver: shipment.driver?.name ?? null,
    vehicle: shipment.vehicle,
    status: humanizeEnum(shipment.status),
    paymentStatus: humanizeEnum(shipment.paymentStatus),
    origin: shipment.origin,
    destination: shipment.destination,
    currentLocation: shipment.currentLocation,
    amount: Number(shipment.amount),
    createdAt: toDateOnly(shipment.createdAt),
    pickupDate: toDateOnly(shipment.pickupDate),
    expectedDeliveryDate: toDateOnly(shipment.expectedDeliveryDate),
    actualDeliveryDate: toDateOnly(shipment.actualDeliveryDate),
    updatedAt: toDateOnly(shipment.updatedAt),
  }
}

/**
 * Shipment.id has no default in the schema, so IDs are generated here using the
 * product's SH-1001 convention. Reads the current maximum and retries on a
 * primary-key collision so two simultaneous creates cannot persist the same id.
 */
async function nextShipmentId() {
  const rows = await prisma.shipment.findMany({ select: { id: true } })
  const highest = rows.reduce((max, shipment) => {
    if (!shipment.id.startsWith(SHIPMENT_PREFIX)) return max
    const numeric = Number.parseInt(shipment.id.slice(SHIPMENT_PREFIX.length), 10)
    return Number.isInteger(numeric) && numeric > max ? numeric : max
  }, 0)

  // The product's first shipment is SH-1001, so never generate below it.
  return `${SHIPMENT_PREFIX}${String(Math.max(1000, highest) + 1).padStart(4, '0')}`
}

function toDateColumn(value) {
  if (!value) return null
  return new Date(`${value}T00:00:00.000Z`)
}

async function requireCustomer(customerId) {
  const customer = await prisma.customer.findUnique({ where: { id: customerId }, select: { id: true } })
  if (!customer) throw AppError.badRequest('Customer does not exist')
  return customer
}

async function requireDriver(driverId) {
  const driver = await prisma.driver.findUnique({ where: { id: driverId }, select: { id: true, name: true } })
  if (!driver) throw AppError.badRequest('Driver does not exist')
  return driver
}

function assertDriverForStatus(status, driverId) {
  if (STATUS_REQUIRES_DRIVER.includes(status) && !driverId) {
    throw AppError.badRequest('A driver is required before a shipment can be Assigned, In Transit or Delivered')
  }
}

export async function listShipments({ page, limit, search, status, customer, driver, sort, order }) {
  const where = {}

  if (search) {
    // Insensitive partial match across the fields the Shipments UI searches on
    // (id, customer name, driver name) plus the route/tracking text.
    where.OR = [
      { id: { contains: search, mode: 'insensitive' } },
      { origin: { contains: search, mode: 'insensitive' } },
      { destination: { contains: search, mode: 'insensitive' } },
      { currentLocation: { contains: search, mode: 'insensitive' } },
      { customer: { businessName: { contains: search, mode: 'insensitive' } } },
      { driver: { name: { contains: search, mode: 'insensitive' } } },
    ]
  }
  if (status) where.status = status
  if (customer) where.customerId = customer
  if (driver) where.driverId = driver

  const [total, shipments] = await Promise.all([
    prisma.shipment.count({ where }),
    prisma.shipment.findMany({
      where,
      orderBy: { [sort]: order },
      skip: (page - 1) * limit,
      take: limit,
      select: SHIPMENT_SELECT,
    }),
  ])

  return {
    shipments: shipments.map(serializeShipment),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  }
}

export async function getShipmentById(id) {
  const shipment = await prisma.shipment.findUnique({ where: { id }, select: SHIPMENT_SELECT })
  if (!shipment) throw AppError.notFound('Shipment not found')
  return serializeShipment(shipment)
}

export async function createShipment(input, actorId = null) {
  const customerId = input.customerId.trim()
  const driverId = input.driverId ? input.driverId.trim() : null
  const status = input.status ?? 'PENDING'

  await requireCustomer(customerId)
  if (driverId) await requireDriver(driverId)
  assertDriverForStatus(status, driverId)

  const data = {
    customerId,
    driverId,
    vehicle: input.vehicle ? input.vehicle.trim() : null,
    status,
    origin: input.origin.trim(),
    destination: input.destination.trim(),
    currentLocation: input.currentLocation ? input.currentLocation.trim() : null,
    amount: input.amount,
    pickupDate: toDateColumn(input.pickupDate),
    expectedDeliveryDate: toDateColumn(input.expectedDeliveryDate),
    actualDeliveryDate: toDateColumn(input.actualDeliveryDate),
  }

  // A shipment created directly as Delivered records its delivery date today
  // rather than staying null.
  if (status === 'DELIVERED' && !data.actualDeliveryDate) data.actualDeliveryDate = new Date()

  const MAX_ATTEMPTS = 3
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const id = await nextShipmentId()
      await prisma.$transaction(async (tx) => {
        await tx.shipment.create({ data: { id, ...data } })
        await tx.activity.create({
          data: {
            type: 'CREATED',
            message: `Shipment ${id} created - ${data.origin} to ${data.destination}`,
            entityType: 'SHIPMENT',
            entityId: id,
            userId: actorId,
          },
        })
      })
      return getShipmentById(id)
    } catch (error) {
      // P2002 here can only be the generated primary key losing a race —
      // regenerate and try again rather than surfacing a conflict.
      const lostRace = error?.code === 'P2002' && attempt < MAX_ATTEMPTS
      if (!lostRace) throw error
    }
  }

  throw AppError.conflict('Could not allocate a unique shipment ID')
}

export async function updateShipment(id, input, actorId = null) {
  const existing = await prisma.shipment.findUnique({
    where: { id },
    select: {
      ...SHIPMENT_SELECT,
      payments: { select: { status: true } },
    },
  })
  if (!existing) throw AppError.notFound('Shipment not found')

  const data = {}
  if (input.customerId !== undefined) {
    const next = input.customerId.trim()
    if (next !== existing.customerId) {
      await requireCustomer(next)
      data.customerId = next
    }
  }

  let newDriverName = null
  if (input.driverId !== undefined) {
    const next = input.driverId ? input.driverId.trim() : null
    if (next !== existing.driverId) {
      if (next) newDriverName = (await requireDriver(next)).name
      data.driverId = next
    }
  }

  const nextStatus = input.status ?? existing.status
  if (input.status !== undefined && input.status !== existing.status) data.status = nextStatus

  const effectiveDriverId = data.driverId !== undefined ? data.driverId : existing.driverId
  assertDriverForStatus(nextStatus, effectiveDriverId)

  if (input.vehicle !== undefined) data.vehicle = input.vehicle ? input.vehicle.trim() : null
  if (input.origin !== undefined) data.origin = input.origin.trim()
  if (input.destination !== undefined) data.destination = input.destination.trim()
  if (input.currentLocation !== undefined) data.currentLocation = input.currentLocation ? input.currentLocation.trim() : null
  if (input.amount !== undefined) data.amount = input.amount

  for (const field of ['pickupDate', 'expectedDeliveryDate', 'actualDeliveryDate']) {
    if (input[field] !== undefined) data[field] = toDateColumn(input[field])
  }

  // Transitioning to Delivered without an explicit date records it as today.
  if (nextStatus === 'DELIVERED' && !data.actualDeliveryDate && !existing.actualDeliveryDate) {
    data.actualDeliveryDate = new Date()
  }

  // No-op patch (every provided field matched the stored value).
  if (Object.keys(data).length === 0) return serializeShipment(existing)

  const statusChanged = data.status !== undefined

  await prisma.$transaction(async (tx) => {
    // Keep the denormalised payment state aligned with the Payment rows.
    const derivedPaymentState = derivePaymentState(existing.payments)
    if (derivedPaymentState !== existing.paymentStatus) data.paymentStatus = derivedPaymentState

    await tx.shipment.update({ where: { id }, data })

    let type = 'UPDATED'
    let message = `Shipment ${id} updated`
    if (statusChanged) {
      switch (nextStatus) {
        case 'ASSIGNED':
          type = 'ASSIGNED'
          message = newDriverName ? `Driver ${newDriverName} assigned to ${id}` : `Shipment ${id} assigned to a driver`
          break
        case 'IN_TRANSIT':
          type = 'TRANSIT'
          message = `Shipment ${id} in transit from ${data.origin ?? existing.origin}`
          break
        case 'DELIVERED':
          type = 'DELIVERED'
          message = `Shipment ${id} delivered to ${data.destination ?? existing.destination}`
          break
        case 'CANCELLED':
          type = 'CANCELLED'
          message = `Shipment ${id} cancelled`
          break
        case 'PENDING':
          message = `Shipment ${id} marked pending`
          break
        default:
          break
      }
    }

    await tx.activity.create({
      data: { type, message, entityType: 'SHIPMENT', entityId: id, userId: actorId },
    })
  })

  return getShipmentById(id)
}

/**
 * Hard delete. Payments reference the shipment with onDelete: Restrict, so a
 * shipment with payment history cannot be removed — the constraint error is
 * translated instead of leaking a Prisma code. Activity rows reference the
 * shipment by free-form entityId and do not block deletion.
 */
export async function deleteShipment(id) {
  const existing = await prisma.shipment.findUnique({ where: { id } })
  if (!existing) throw AppError.notFound('Shipment not found')

  const payments = await prisma.payment.count({ where: { shipmentId: id } })
  if (payments > 0) {
    throw AppError.badRequest('Cannot delete a shipment that still has payments. Delete those payments first.')
  }

  try {
    await prisma.shipment.delete({ where: { id } })
  } catch (error) {
    const constraintViolation =
      error?.code === 'P2003' ||
      (typeof error?.message === 'string' && (error.message.includes('23001') || error.message.includes('violates RESTRICT')))
    if (constraintViolation) {
      throw AppError.badRequest('Cannot delete a shipment that still has payments. Delete those payments first.')
    }
    throw error
  }

  return { id }
}