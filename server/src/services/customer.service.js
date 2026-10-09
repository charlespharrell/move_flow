import prisma from '../lib/prisma.js'
import AppError from '../utils/AppError.js'
import { humanizeEnum, toDateOnly } from '../utils/enums.js'

const CUSTOMER_PREFIX = 'CUST-'

/** Zeroed shipment aggregates for customers without any shipments. */
const EMPTY_SHIPMENT_STATS = { total: 0, active: 0, delivered: 0, totalSpending: 0 }

/** Safe customer DTO — the API never exposes internal columns. */
export function serializeCustomer(customer) {
  if (!customer) return null
  return {
    id: customer.id,
    businessName: customer.businessName,
    contactName: customer.contactName,
    email: customer.email,
    phone: customer.phone,
    status: humanizeEnum(customer.status),
    dateJoined: toDateOnly(customer.dateJoined),
    createdAt: toDateOnly(customer.createdAt),
    updatedAt: toDateOnly(customer.updatedAt),
  }
}

/**
 * Customer.id has no default in the schema, so IDs are generated here using the
 * product's CUST-001 convention. Reads the current maximum and retries on a
 * primary-key collision so two simultaneous creates cannot persist the same id.
 */
async function nextCustomerId() {
  const customers = await prisma.customer.findMany({ select: { id: true } })
  const highest = customers.reduce((max, customer) => {
    if (!customer.id.startsWith(CUSTOMER_PREFIX)) return max
    const numeric = Number.parseInt(customer.id.slice(CUSTOMER_PREFIX.length), 10)
    return Number.isInteger(numeric) && numeric > max ? numeric : max
  }, 0)

  return `${CUSTOMER_PREFIX}${String(highest + 1).padStart(3, '0')}`
}

function toDateColumn(value) {
  return value ? new Date(`${value}T00:00:00.000Z`) : new Date()
}

export async function listCustomers({ page, limit, search, status, sort, order }) {
  const where = {}

  if (search) {
    // Insensitive partial match across the fields the UI searches on.
    where.OR = [
      { id: { contains: search, mode: 'insensitive' } },
      { businessName: { contains: search, mode: 'insensitive' } },
      { contactName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
    ]
  }
  if (status) where.status = status

  const [total, customers] = await Promise.all([
    prisma.customer.count({ where }),
    prisma.customer.findMany({
      where,
      orderBy: { [sort]: order },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ])

  // Shipment aggregates for the list's "Shipments" / "Total Spending" columns —
  // one grouped query per page instead of a per-customer round trip. Grouping by
  // status yields the same totals the detail page's relationship summary returns.
  const statsByCustomer = new Map()
  if (customers.length > 0) {
    const grouped = await prisma.shipment.groupBy({
      by: ['customerId', 'status'],
      where: { customerId: { in: customers.map((customer) => customer.id) } },
      _count: { _all: true },
      _sum: { amount: true },
    })
    for (const row of grouped) {
      const entry = statsByCustomer.get(row.customerId) ?? { ...EMPTY_SHIPMENT_STATS }
      entry.total += row._count._all
      if (row.status === 'ASSIGNED' || row.status === 'IN_TRANSIT') entry.active += row._count._all
      if (row.status === 'DELIVERED') entry.delivered += row._count._all
      entry.totalSpending += Number(row._sum.amount ?? 0)
      statsByCustomer.set(row.customerId, entry)
    }
  }

  return {
    customers: customers.map((customer) => ({
      ...serializeCustomer(customer),
      shipmentStats: statsByCustomer.get(customer.id) ?? EMPTY_SHIPMENT_STATS,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  }
}

export async function getCustomerById(id) {
  const customer = await prisma.customer.findUnique({ where: { id } })
  if (!customer) throw AppError.notFound('Customer not found')
  return serializeCustomer(customer)
}

/**
 * Read-only shipment relationship summary for the CustomerDetails page —
 * aggregate counts only, no shipment records (the history list comes from the
 * Shipments API). Semantics: active = Assigned + In Transit.
 */
export async function getCustomerRelationship(id) {
  const [total, active, delivered, spending] = await Promise.all([
    prisma.shipment.count({ where: { customerId: id } }),
    prisma.shipment.count({ where: { customerId: id, status: { in: ['ASSIGNED', 'IN_TRANSIT'] } } }),
    prisma.shipment.count({ where: { customerId: id, status: 'DELIVERED' } }),
    prisma.shipment.aggregate({ where: { customerId: id }, _sum: { amount: true } }),
  ])

  return {
    shipments: {
      total,
      active,
      delivered,
      totalSpending: Number(spending._sum.amount ?? 0),
    },
  }
}

export async function createCustomer(input) {
  const data = {
    businessName: input.businessName.trim(),
    contactName: input.contactName.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone.trim(),
    status: input.status ?? 'ACTIVE',
    dateJoined: toDateColumn(input.dateJoined),
  }

  const MAX_ATTEMPTS = 3
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const created = await prisma.customer.create({ data: { id: await nextCustomerId(), ...data } })
      return serializeCustomer(created)
    } catch (error) {
      // P2002 here can only be the generated primary key losing a race —
      // regenerate and try again rather than surfacing a conflict.
      const lostRace = error?.code === 'P2002' && attempt < MAX_ATTEMPTS
      if (!lostRace) throw error
    }
  }

  throw AppError.conflict('Could not allocate a unique customer ID')
}

export async function updateCustomer(id, input) {
  const existing = await prisma.customer.findUnique({ where: { id } })
  if (!existing) throw AppError.notFound('Customer not found')

  const data = {}

  if (input.businessName !== undefined) data.businessName = input.businessName.trim()
  if (input.contactName !== undefined) data.contactName = input.contactName.trim()
  if (input.phone !== undefined) data.phone = input.phone.trim()
  if (input.status !== undefined) data.status = input.status
  if (input.dateJoined !== undefined) data.dateJoined = toDateColumn(input.dateJoined)
  if (input.email !== undefined) data.email = input.email.trim().toLowerCase()

  const updated = await prisma.customer.update({ where: { id }, data })
  return serializeCustomer(updated)
}

/**
 * Hard delete. Shipments and payments reference the customer with
 * onDelete: Restrict, so a customer with history cannot be removed — the
 * constraint error is translated instead of leaking a Prisma code.
 */
export async function deleteCustomer(id) {
  const existing = await prisma.customer.findUnique({ where: { id } })
  if (!existing) throw AppError.notFound('Customer not found')

  const [shipments, payments] = await Promise.all([
    prisma.shipment.count({ where: { customerId: id } }),
    prisma.payment.count({ where: { customerId: id } }),
  ])
  if (shipments > 0 || payments > 0) {
    const related = shipments > 0 ? 'shipments' : 'payments'
    throw AppError.badRequest(
      `Cannot delete a customer that still has ${related}. Remove or reassign those records first.`,
    )
  }

  try {
    await prisma.customer.delete({ where: { id } })
  } catch (error) {
    // A shipment/payment created between the counts above and the delete would
    // hit the database's ON DELETE RESTRICT (Postgres 23001, surfaced by Prisma
    // as an unknown request error rather than P2003) — still a user-facing 400.
    const constraintViolation =
      error?.code === 'P2003' ||
      error?.code === 'P2014' ||
      (typeof error?.message === 'string' && (error.message.includes('23001') || error.message.includes('violates RESTRICT')))
    if (constraintViolation) {
      throw AppError.badRequest(
        'Cannot delete a customer that still has shipments or payments. Remove or reassign those records first.',
      )
    }
    throw error
  }

  return { id }
}
