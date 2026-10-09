import { z } from 'zod'
import { AccountStatus } from '@prisma/client'
import { enumInput } from './shared.js'

// Mirrors src/utils/validation.js `isPhone`: 10–15 digits once separators are
// stripped, so the API accepts exactly what the form accepts.
const phoneDigits = (value) => {
  const digits = value.replace(/\D/g, '')
  return digits.length >= 10 && digits.length <= 15
}

const businessName = z
  .string({ required_error: 'Business name is required' })
  .trim()
  .min(2, 'Business name must be at least 2 characters')
  .max(160, 'Business name must be at most 160 characters')

const contactName = z
  .string({ required_error: 'Contact name is required' })
  .trim()
  .min(2, 'Contact name must be at least 2 characters')
  .max(120, 'Contact name must be at most 120 characters')

const email = z
  .string({ required_error: 'Email is required' })
  .trim()
  .toLowerCase()
  .email('Enter a valid email address')
  .max(200, 'Email must be at most 200 characters')

const phone = z
  .string({ required_error: 'Phone is required' })
  .trim()
  .min(7, 'Phone is required')
  .max(30, 'Phone must be at most 30 characters')
  .refine(phoneDigits, 'Enter a valid phone number')

const dateJoined = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'dateJoined must be YYYY-MM-DD')
  .optional()

export const createCustomerSchema = z
  .object({
    businessName,
    contactName,
    email,
    phone,
    status: enumInput(AccountStatus, 'Status').optional(),
    dateJoined,
  })
  .strict()

// Every field optional, but at least one must be supplied.
export const updateCustomerSchema = z
  .object({
    businessName: businessName.optional(),
    contactName: contactName.optional(),
    email: email.optional(),
    phone: phone.optional(),
    status: enumInput(AccountStatus, 'Status').optional(),
    dateJoined,
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Provide at least one field to update',
  })

export const listCustomersQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1, 'page must be 1 or greater').default(1),
    limit: z.coerce.number().int().min(1).max(100, 'limit must be 100 or fewer').default(8),
    search: z.string().trim().max(120).optional(),
    status: enumInput(AccountStatus, 'Status').optional(),
    sort: z.enum(['businessName', 'contactName', 'dateJoined', 'createdAt']).default('createdAt'),
    order: z.enum(['asc', 'desc']).default('desc'),
  })
  .strict()

export const idParamSchema = z
  .object({ id: z.string().trim().min(1, 'id is required') })
  .strict()
