import { z } from 'zod'
import { PaymentMethod, PaymentStatus } from '@prisma/client'
import { enumInput } from './shared.js'

const shipmentId = z
  .string({ required_error: 'Shipment is required' })
  .trim()
  .min(1, 'Shipment is required')
  .max(64, 'Shipment must be at most 64 characters')

const customerId = z
  .string({ required_error: 'Customer is required' })
  .trim()
  .min(1, 'Customer is required')
  .max(64, 'Customer must be at most 64 characters')

const amount = z
  .number({ required_error: 'Amount is required' })
  .positive('Amount must be greater than 0')
  .max(9_999_999_999.99, 'Amount is too large')
  .refine(Number.isFinite, 'Amount must be a finite number')

const transactionReference = z
  .string({ required_error: 'Transaction reference is required' })
  .trim()
  .min(3, 'Transaction reference must be at least 3 characters')
  .max(64, 'Transaction reference must be at most 64 characters')

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'must be a date in YYYY-MM-DD format')

const optionalDate = dateOnly.optional()

// On update, null clears the field; omission leaves it untouched.
const nullableDate = z.union([dateOnly, z.null()]).optional()

export const createPaymentSchema = z
  .object({
    shipmentId,
    customerId,
    amount,
    paymentMethod: enumInput(PaymentMethod, 'Payment Method'),
    status: enumInput(PaymentStatus, 'Status').default('PENDING'),
    transactionReference,
    paidAt: optionalDate,
    refundedAt: optionalDate,
  })
  .strict()

// Every field optional, but at least one must be supplied. Null clears
// nullable dates (paidAt, refundedAt).
export const updatePaymentSchema = z
  .object({
    shipmentId: shipmentId.optional(),
    customerId: customerId.optional(),
    amount: amount.optional(),
    paymentMethod: enumInput(PaymentMethod, 'Payment Method').optional(),
    status: enumInput(PaymentStatus, 'Status').optional(),
    transactionReference: transactionReference.optional(),
    paidAt: nullableDate,
    refundedAt: nullableDate,
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Provide at least one field to update',
  })

export const listPaymentsQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1, 'page must be 1 or greater').default(1),
    limit: z.coerce.number().int().min(1).max(100, 'limit must be 100 or fewer').default(8),
    search: z.string().trim().max(120, 'search must be 120 characters or fewer').optional(),
    status: enumInput(PaymentStatus, 'Status').optional(),
    paymentMethod: enumInput(PaymentMethod, 'Payment Method').optional(),
    shipment: z.string().trim().min(1).max(64).optional(),
    customer: z.string().trim().min(1).max(64).optional(),
    sort: z.enum(['createdAt', 'amount', 'status', 'paidAt', 'transactionReference']).default('createdAt'),
    order: z.enum(['asc', 'desc']).default('desc'),
  })
  .strict()

export const idParamSchema = z
  .object({ id: z.string().trim().min(1, 'id is required') })
  .strict()