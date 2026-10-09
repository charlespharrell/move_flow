import { z } from 'zod'
import { DriverStatus, LicenseStatus, VehicleType, VerificationStatus } from '@prisma/client'
import { enumInput } from './shared.js'

// Mirrors src/utils/validation.js `isPhone`: 10–15 digits once separators are
// stripped, so the API accepts exactly what the form accepts.
const phoneDigits = (value) => {
  const digits = value.replace(/\D/g, '')
  return digits.length >= 10 && digits.length <= 15
}

const name = z
  .string({ required_error: 'Name is required' })
  .trim()
  .min(2, 'Name must be at least 2 characters')
  .max(120, 'Name must be at most 120 characters')

const phone = z
  .string({ required_error: 'Phone is required' })
  .trim()
  .min(7, 'Phone is required')
  .max(30, 'Phone must be at most 30 characters')
  .refine(phoneDigits, 'Enter a valid phone number')

const email = z
  .string({ required_error: 'Email is required' })
  .trim()
  .toLowerCase()
  .email('Enter a valid email address')
  .max(200, 'Email must be at most 200 characters')

const vehicle = z
  .string({ required_error: 'Vehicle is required' })
  .trim()
  .min(2, 'Vehicle must be at least 2 characters')
  .max(120, 'Vehicle must be at most 120 characters')

const joinedDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'joinedDate must be YYYY-MM-DD')
  .optional()

export const createDriverSchema = z
  .object({
    name,
    phone,
    email,
    vehicle,
    vehicleType: enumInput(VehicleType, 'Vehicle Type').default('TRUCK'),
    licenseStatus: enumInput(LicenseStatus, 'License Status').default('VALID'),
    verificationStatus: enumInput(VerificationStatus, 'Verification').default('PENDING'),
    status: enumInput(DriverStatus, 'Status').default('AVAILABLE'),
    joinedDate,
  })
  .strict()

// Every field optional, but at least one must be supplied.
export const updateDriverSchema = z
  .object({
    name: name.optional(),
    phone: phone.optional(),
    email: email.optional(),
    vehicle: vehicle.optional(),
    vehicleType: enumInput(VehicleType, 'Vehicle Type').optional(),
    licenseStatus: enumInput(LicenseStatus, 'License Status').optional(),
    verificationStatus: enumInput(VerificationStatus, 'Verification').optional(),
    status: enumInput(DriverStatus, 'Status').optional(),
    joinedDate,
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Provide at least one field to update',
  })

// `verification` maps to the verificationStatus column in the service.
export const listDriversQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1, 'page must be 1 or greater').default(1),
    limit: z.coerce.number().int().min(1).max(100, 'limit must be 100 or fewer').default(8),
    search: z.string().trim().max(120, 'search must be 120 characters or fewer').optional(),
    status: enumInput(DriverStatus, 'Status').optional(),
    verification: enumInput(VerificationStatus, 'Verification').optional(),
    vehicleType: enumInput(VehicleType, 'Vehicle Type').optional(),
    licenseStatus: enumInput(LicenseStatus, 'License Status').optional(),
    sort: z
      .enum(['name', 'joinedDate', 'createdAt', 'status', 'vehicleType', 'licenseStatus', 'verificationStatus'])
      .default('createdAt'),
    order: z.enum(['asc', 'desc']).default('desc'),
  })
  .strict()

export const idParamSchema = z
  .object({ id: z.string().trim().min(1, 'id is required') })
  .strict()