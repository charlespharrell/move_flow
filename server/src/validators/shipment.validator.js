import { z } from 'zod'
import { ShipmentStatus } from '@prisma/client'
import { enumInput } from './shared.js'

// A shipment cannot be Assigned, In Transit or Delivered without a driver.
export const STATUS_REQUIRES_DRIVER = ['ASSIGNED', 'IN_TRANSIT', 'DELIVERED']

const id = z.string({ required_error: 'Customer is required' }).trim().min(1, 'Customer is required').max(64)

const driverId = z
  .string({ required_error: 'Driver is required' })
  .trim()
  .min(1, 'Driver is required')
  .max(64)
  .nullable()
  .optional()

const origin = z
  .string({ required_error: 'Origin is required' })
  .trim()
  .min(2, 'Origin must be at least 2 characters')
  .max(160, 'Origin must be at most 160 characters')

const destination = z
  .string({ required_error: 'Destination is required' })
  .trim()
  .min(2, 'Destination must be at least 2 characters')
  .max(160, 'Destination must be at most 160 characters')

const amount = z
  .number({ required_error: 'Amount is required' })
  .positive('Amount must be greater than 0')
  .max(9_999_999_999.99, 'Amount is too large')
  .refine(Number.isFinite, 'Amount must be a finite number')

const vehicle = z.string().trim().max(80, 'Vehicle must be at most 80 characters').nullable().optional()

const currentLocation = z
  .string()
  .trim()
  .max(160, 'Current location must be at most 160 characters')
  .nullable()
  .optional()

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'must be a date in YYYY-MM-DD format')

const optionalDate = dateOnly.optional()

// On update, null clears the field; omission leaves it untouched.
const nullableDate = z.union([dateOnly, z.null()]).optional()

export const createShipmentSchema = z
  .object({
    customerId: id,
    driverId,
    vehicle,
    status: enumInput(ShipmentStatus, 'Status').default('PENDING'),
    origin,
    destination,
    currentLocation,
    amount,
    pickupDate: optionalDate,
    expectedDeliveryDate: optionalDate,
    actualDeliveryDate: optionalDate,
  })
  .strict()
  .refine(
    (value) => !STATUS_REQUIRES_DRIVER.includes(value.status) || Boolean(value.driverId),
    {
      message: 'A driver is required when the shipment status is Assigned, In Transit or Delivered',
      path: ['driverId'],
    },
  )

// Every field optional, but at least one must be supplied. Null clears
// nullable fields (driverId, vehicle, currentLocation, dates).
export const updateShipmentSchema = z
  .object({
    customerId: id.optional(),
    driverId,
    vehicle,
    status: enumInput(ShipmentStatus, 'Status').optional(),
    origin: origin.optional(),
    destination: destination.optional(),
    currentLocation,
    amount: amount.optional(),
    pickupDate: nullableDate,
    expectedDeliveryDate: nullableDate,
    actualDeliveryDate: nullableDate,
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Provide at least one field to update',
  })

export const listShipmentsQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1, 'page must be 1 or greater').default(1),
    limit: z.coerce.number().int().min(1).max(100, 'limit must be 100 or fewer').default(8),
    search: z.string().trim().max(120, 'search must be 120 characters or fewer').optional(),
    status: enumInput(ShipmentStatus, 'Status').optional(),
    customer: z.string().trim().min(1).max(64).optional(),
    driver: z.string().trim().min(1).max(64).optional(),
    sort: z.enum(['createdAt', 'amount', 'status', 'expectedDeliveryDate']).default('createdAt'),
    order: z.enum(['asc', 'desc']).default('desc'),
  })
  .strict()

export const idParamSchema = z
  .object({ id: z.string().trim().min(1, 'id is required') })
  .strict()