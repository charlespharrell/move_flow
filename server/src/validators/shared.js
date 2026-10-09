import { z } from 'zod'
import { resolveEnumValue } from '../utils/enums.js'

/**
 * Accepts either display form ("Operations Manager") or the raw enum member
 * ("OPERATIONS_MANAGER") and resolves it against a Prisma enum object.
 */
export function enumInput(enumObject, label) {
  const allowed = Object.values(enumObject)
  return z
    .string({ required_error: `${label} is required` })
    .trim()
    .min(1, `${label} is required`)
    .transform((value) => resolveEnumValue(value, enumObject))
    .refine((value) => value !== null, {
      message: `${label} must be one of: ${allowed.join(', ')}`,
    })
}

export function formatIssues(error) {
  return error.issues.map((issue) => ({
    field: issue.path.join('.') || '(root)',
    message: issue.message,
  }))
}