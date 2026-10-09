import prisma from '../lib/prisma.js'
import AppError from '../utils/AppError.js'
import { humanizeEnum, toDateOnly } from '../utils/enums.js'

const DRIVER_PREFIX = 'DRV-'
// Shipments this DTO considers "active" — matches the frontend's Assigned /
// In Transit convention in driverService.js getDriverStats.
const ACTIVE_STATUSES = ['ASSIGNED', 'IN_TRANSIT']

// Shipment fields loaded alongside a driver: only what the drivers list table
// renders (completed count, current active shipment id), never full records.
const SHIPMENT_SUMMARY_SELECT = {
  id: true,
  status: true,
  origin: true,
  destination: true,
  amount: true,
  createdAt: true,
  customer: { select: { businessName: true } },
}

const DRIVER_SELECT = {
  id: true,
  name: true,
  phone: true,
  email: true,
  vehicle: true,
  vehicleType: true,
  licenseStatus: true,
  verificationStatus: true,
  status: true,
  joinedDate: true,
  createdAt: true,
  updatedAt: true,
  shipments: {
    select: { id: true, status: true },
    orderBy: { createdAt: 'desc' },
  },
}

/**
 * Frontend-friendly driver DTO — mirrors the shape of src/data/drivers.js plus
 * the derived columns the Drivers list page consumes (completed, current
 * shipment id). One serializer serves both list and detail.
 */
export function serializeDriver(driver) {
  if (!driver) return null
  const assignments = driver.shipments ?? []
  const active = assignments.filter((shipment) => ACTIVE_STATUSES.includes(shipment.status))
  const completed = assignments.filter((shipment) => shipment.status === 'DELIVERED').length

  return {
    id: driver.id,
    name: driver.name,
    phone: driver.phone,
    email: driver.email,
    vehicle: driver.vehicle,
    vehicleType: humanizeEnum(driver.vehicleType),
    licenseStatus: humanizeEnum(driver.licenseStatus),
    verificationStatus: humanizeEnum(driver.verificationStatus),
    status: humanizeEnum(driver.status),
    joinedDate: toDateOnly(driver.joinedDate),
    createdAt: toDateOnly(driver.createdAt),
    updatedAt: toDateOnly(driver.updatedAt),
    completed,
    currentShipmentId: active[0]?.id ?? null,
  }
}

function serializeShipmentSummary(shipment) {
  if (!shipment) return null
  return {
    id: shipment.id,
    status: humanizeEnum(shipment.status),
    origin: shipment.origin,
    destination: shipment.destination,
    customer: shipment.customer?.businessName ?? null,
    amount: Number(shipment.amount),
    createdAt: toDateOnly(shipment.createdAt),
  }
}

/**
 * Driver.id has no default in the schema, so IDs are generated here using the
 * product's DRV-001 convention. Retries on a primary-key collision so two
 * simultaneous creates cannot persist the same id.
 */
async function nextDriverId() {
  const drivers = await prisma.driver.findMany({ select: { id: true } })
  const highest = drivers.reduce((max, driver) => {
    if (!driver.id.startsWith(DRIVER_PREFIX)) return max
    const numeric = Number.parseInt(driver.id.slice(DRIVER_PREFIX.length), 10)
    return Number.isInteger(numeric) && numeric > max ? numeric : max
  }, 0)

  return `${DRIVER_PREFIX}${String(highest + 1).padStart(3, '0')}`
}

function toDateColumn(value) {
  return value ? new Date(`${value}T00:00:00.000Z`) : null
}

export async function listDrivers({ page, limit, search, status, verification, vehicleType, licenseStatus, sort, order }) {
  const where = {}

  if (search) {
    // Insensitive partial match across the fields the Drivers UI searches on.
    // The Driver model has no license number column, so none is included.
    where.OR = [
      { id: { contains: search, mode: 'insensitive' } },
      { name: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { vehicle: { contains: search, mode: 'insensitive' } },
    ]
  }
  if (status) where.status = status
  if (verification) where.verificationStatus = verification
  if (vehicleType) where.vehicleType = vehicleType
  if (licenseStatus) where.licenseStatus = licenseStatus

  const [total, drivers] = await Promise.all([
    prisma.driver.count({ where }),
    prisma.driver.findMany({
      where,
      orderBy: { [sort]: order },
      skip: (page - 1) * limit,
      take: limit,
      select: DRIVER_SELECT,
    }),
  ])

  return {
    drivers: drivers.map(serializeDriver),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  }
}

export async function getDriverById(id) {
  const driver = await prisma.driver.findUnique({ where: { id }, select: DRIVER_SELECT })
  if (!driver) throw AppError.notFound('Driver not found')
  return serializeDriver(driver)
}

/**
 * Read-only shipment relationship summary for the DriverDetails page — mirrors
 * the frontend's `getDriverStats`/`getCurrentDriverShipment` semantics (active =
 * Assigned + In Transit, totalValue = summed shipment amounts). The history
 * table rows are included as lightweight summaries sorted newest-first.
 */
export async function getDriverRelationship(id) {
  const [total, active, delivered, spending, shipments] = await Promise.all([
    prisma.shipment.count({ where: { driverId: id } }),
    prisma.shipment.count({ where: { driverId: id, status: { in: ACTIVE_STATUSES } } }),
    prisma.shipment.count({ where: { driverId: id, status: 'DELIVERED' } }),
    prisma.shipment.aggregate({ where: { driverId: id }, _sum: { amount: true } }),
    prisma.shipment.findMany({
      where: { driverId: id },
      orderBy: { createdAt: 'desc' },
      select: SHIPMENT_SUMMARY_SELECT,
    }),
  ])

  const currentShipment = shipments.find((shipment) => ACTIVE_STATUSES.includes(shipment.status))

  return {
    shipments: {
      total,
      active,
      completed: delivered,
      totalValue: Number(spending._sum.amount ?? 0),
      items: shipments.map(serializeShipmentSummary),
    },
    currentShipment: serializeShipmentSummary(currentShipment ?? null),
  }
}

export async function createDriver(input, actorId = null) {
  const data = {
    name: input.name.trim(),
    phone: input.phone.trim(),
    email: input.email.trim().toLowerCase(),
    vehicle: input.vehicle.trim(),
    vehicleType: input.vehicleType ?? 'TRUCK',
    licenseStatus: input.licenseStatus ?? 'VALID',
    verificationStatus: input.verificationStatus ?? 'PENDING',
    status: input.status ?? 'AVAILABLE',
  }
  // Omitting the key keeps Prisma's @default(now()) — never write null.
  if (input.joinedDate !== undefined) data.joinedDate = toDateColumn(input.joinedDate)

  const MAX_ATTEMPTS = 3
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const id = await nextDriverId()
      await prisma.$transaction(async (tx) => {
        await tx.driver.create({ data: { id, ...data } })
        await tx.activity.create({
          data: {
            type: 'CREATED',
            message: `Driver ${id} created - ${data.name}`,
            entityType: 'DRIVER',
            entityId: id,
            userId: actorId,
          },
        })
      })
      return getDriverById(id)
    } catch (error) {
      // P2002 here can only be the generated primary key losing a race —
      // regenerate and try again rather than surfacing a conflict.
      const lostRace = error?.code === 'P2002' && attempt < MAX_ATTEMPTS
      if (!lostRace) throw error
    }
  }

  throw AppError.conflict('Could not allocate a unique driver ID')
}

export async function updateDriver(id, input, actorId = null) {
  const existing = await prisma.driver.findUnique({ where: { id }, select: DRIVER_SELECT })
  if (!existing) throw AppError.notFound('Driver not found')

  const data = {}

  if (input.name !== undefined) data.name = input.name.trim()
  if (input.phone !== undefined) data.phone = input.phone.trim()
  if (input.email !== undefined) data.email = input.email.trim().toLowerCase()
  if (input.vehicle !== undefined) data.vehicle = input.vehicle.trim()
  if (input.vehicleType !== undefined) data.vehicleType = input.vehicleType
  if (input.licenseStatus !== undefined) data.licenseStatus = input.licenseStatus
  if (input.verificationStatus !== undefined) data.verificationStatus = input.verificationStatus
  if (input.status !== undefined) data.status = input.status
  if (input.joinedDate !== undefined) data.joinedDate = toDateColumn(input.joinedDate)

  // No-op patch (every provided field matched the stored value).
  if (Object.keys(data).length === 0) return serializeDriver(existing)

  await prisma.$transaction(async (tx) => {
    await tx.driver.update({ where: { id }, data })
    await tx.activity.create({
      data: {
        type: 'UPDATED',
        message: `Driver ${data.name ?? existing.name} (${id}) updated`,
        entityType: 'DRIVER',
        entityId: id,
        userId: actorId,
      },
    })
  })

  return getDriverById(id)
}

/**
 * Hard delete. Shipments reference the driver with onDelete: Restrict, so a
 * driver with assignments cannot be removed — the constraint error is
 * translated instead of leaking a Prisma code. No activity row is written on
 * delete because ActivityType has no DELETED member.
 */
export async function deleteDriver(id) {
  const existing = await prisma.driver.findUnique({ where: { id } })
  if (!existing) throw AppError.notFound('Driver not found')

  const assignments = await prisma.shipment.count({ where: { driverId: id } })
  if (assignments > 0) {
    throw AppError.badRequest(
      'Cannot delete a driver that still has shipment assignments. Reassign or remove those shipments first.',
    )
  }

  try {
    await prisma.driver.delete({ where: { id } })
  } catch (error) {
    // A shipment assigned between the count above and the delete would hit the
    // database's ON DELETE RESTRICT (Postgres 23001, surfaced by Prisma as an
    // unknown request error rather than P2003) — still a user-facing 400.
    const constraintViolation =
      error?.code === 'P2003' ||
      error?.code === 'P2014' ||
      (typeof error?.message === 'string' && (error.message.includes('23001') || error.message.includes('violates RESTRICT')))
    if (constraintViolation) {
      throw AppError.badRequest(
        'Cannot delete a driver that still has shipment assignments. Reassign or remove those shipments first.',
      )
    }
    throw error
  }

  return { id }
}