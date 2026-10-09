import prisma from '../lib/prisma.js'
import { ShipmentStatus } from '@prisma/client'
import { humanizeEnum } from '../utils/enums.js'
import { serializeShipment } from './shipment.service.js'

// Fixed three-letter month labels — locale-independent, matching the labels the
// existing dashboard chart renders (Sep, Aug, …).
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// Number of buckets shown by the frontend's shipment-activity and revenue
// charts (the mock hardcodes Sep..Apr = 6 monthly periods).
const TREND_PERIODS = 6

// Dashboard recent lists: 5 rows for shipments (the frontend calls
// getRecentShipments(5)) and a small activity feed like the current mock.
const RECENT_SHIPMENTS_LIMIT = 5
const RECENT_ACTIVITY_LIMIT = 8

// Exactly the fields serializeShipment reads, so recent rows reuse the existing
// shipment serializer instead of duplicating a DTO.
const RECENT_SHIPMENT_SELECT = {
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

/** Every supported shipment status with a zero baseline, from the Prisma enum. */
function zeroedShipmentCounts() {
  return Object.fromEntries(Object.values(ShipmentStatus).map((status) => [status, 0]))
}

function monthKey(year, monthIndex) {
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}`
}

/** Last TREND_PERIODS month keys (oldest -> newest), ending at the current month. */
function recentMonthKeys() {
  const now = new Date()
  const keys = []
  for (let offset = TREND_PERIODS - 1; offset >= 0; offset -= 1) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1))
    keys.push({ month: monthKey(d.getUTCFullYear(), d.getUTCMonth()), label: MONTH_LABELS[d.getUTCMonth()] })
  }
  return keys
}

/**
 * Relative timestamp in the mock's vocabulary ("2h ago", "1d ago") so the
 * existing Recent Activity panel can render the value directly later.
 */
function formatRelativeTime(value) {
  const seconds = Math.floor((Date.now() - new Date(value).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return `${Math.floor(days / 30)}mo ago`
}

function serializeActivity(activity) {
  if (!activity) return null
  // Lowercased enum member matches the mock's `type` vocabulary
  // (created/assigned/transit/delivered/cancelled/payment, plus "updated").
  return {
    id: activity.id,
    type: String(activity.type).toLowerCase(),
    message: activity.message,
    entityType: activity.entityType ?? null,
    entityId: activity.entityId ?? null,
    actor: activity.user?.name ?? null,
    createdAt: activity.createdAt.toISOString(),
    time: formatRelativeTime(activity.createdAt),
  }
}

/**
 * Summary card values. `shipmentCounts`/`paymentCounts` are the grouped results
 * already fetched by the caller — one fewer query per dashboard load.
 */
function buildSummary(shipmentCounts, paymentCounts) {
  const { ASSIGNED, IN_TRANSIT, DELIVERED, PENDING, CANCELLED } = shipmentCounts
  const { PAID, PENDING: pendingPayments, FAILED, REFUNDED } = paymentCounts
  const paidSum = paymentCounts.paidSum

  return {
    totalShipments: Object.values(shipmentCounts).reduce((sum, count) => sum + count, 0),
    activeShipments: ASSIGNED + IN_TRANSIT,
    deliveredShipments: DELIVERED,
    pendingShipments: PENDING,
    assignedShipments: ASSIGNED,
    inTransitShipments: IN_TRANSIT,
    cancelledShipments: CANCELLED,
    totalRevenue: Number(paidSum ?? 0),
    paidPayments: PAID,
    pendingPayments,
    failedPayments: FAILED,
    refundedPayments: REFUNDED,
  }
}

/**
 * Status-bar chart data. Derived from the Prisma enum so labels cannot drift
 * from the database, and zero-filled so the chart always renders every status.
 */
function buildShipmentStatusDistribution(shipmentCounts) {
  return Object.values(ShipmentStatus).map((status) => ({
    status: humanizeEnum(status),
    count: shipmentCounts[status] ?? 0,
  }))
}

/**
 * Monthly shipment volume for the activity-over-time chart. Aggregated in the
 * database via to_char — grouping never depends on JavaScript locale handling.
 */
async function getShipmentTrend() {
  const rows = await prisma.$queryRaw`
    SELECT to_char("createdAt", 'YYYY-MM') AS month, COUNT(*)::int AS count
    FROM "shipments"
    GROUP BY 1
    ORDER BY 1
  `
  const byMonth = new Map((rows ?? []).map((row) => [row.month, Number(row.count)]))
  return recentMonthKeys().map(({ month, label }) => ({
    month,
    label,
    count: byMonth.get(month) ?? 0,
  }))
}

/**
 * Monthly revenue for the revenue chart — paid payments only, summed in
 * PostgreSQL numeric and serialized as numbers. Failed/refunded rows never
 * count as revenue.
 */
async function getRevenueTrend() {
  const rows = await prisma.$queryRaw`
    SELECT to_char("createdAt", 'YYYY-MM') AS month, COALESCE(SUM("amount"), 0)::numeric AS total
    FROM "payments"
    WHERE status = 'PAID'
    GROUP BY 1
    ORDER BY 1
  `
  const byMonth = new Map((rows ?? []).map((row) => [row.month, Number(row.total)]))
  return recentMonthKeys().map(({ month, label }) => ({
    month,
    label,
    total: byMonth.get(month) ?? 0,
  }))
}

async function getRecentShipments() {
  const shipments = await prisma.shipment.findMany({
    orderBy: { createdAt: 'desc' },
    take: RECENT_SHIPMENTS_LIMIT,
    select: RECENT_SHIPMENT_SELECT,
  })
  return shipments.map(serializeShipment)
}

async function getRecentActivity() {
  const activity = await prisma.activity.findMany({
    orderBy: { createdAt: 'desc' },
    take: RECENT_ACTIVITY_LIMIT,
    include: { user: { select: { name: true } } },
  })
  return activity.map(serializeActivity)
}

/**
 * Full dashboard payload: every section the existing Dashboard renders,
 * computed with PostgreSQL/Prisma aggregations and limited recent rows. The
 * endpoint is a single read with no query knobs in the current contract.
 */
export async function getDashboardData() {
  const [counts, paymentGroups] = await Promise.all([
    prisma.shipment.groupBy({ by: ['status'], _count: { _all: true } }),
    // One grouped query yields both the payment status counts and the paid sum.
    prisma.payment.groupBy({ by: ['status'], _count: { _all: true }, _sum: { amount: true } }),
  ])

  const shipmentCounts = zeroedShipmentCounts()
  counts.forEach((group) => {
    if (group.status in shipmentCounts) shipmentCounts[group.status] = group._count._all
  })

  const paymentCounts = { PENDING: 0, PAID: 0, FAILED: 0, REFUNDED: 0 }
  paymentGroups.forEach((group) => {
    if (group.status in paymentCounts) paymentCounts[group.status] = group._count._all
  })
  paymentCounts.paidSum =
    paymentGroups.find((group) => group.status === 'PAID')?._sum.amount ?? 0

  const [shipmentTrend, revenueTrend, recentShipments, recentActivity] = await Promise.all([
    getShipmentTrend(),
    getRevenueTrend(),
    getRecentShipments(),
    getRecentActivity(),
  ])

  return {
    summary: buildSummary(shipmentCounts, paymentCounts),
    shipmentStatusDistribution: buildShipmentStatusDistribution(shipmentCounts),
    shipmentTrend,
    revenueTrend,
    recentShipments,
    recentActivity,
  }
}