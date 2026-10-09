import { z } from 'zod'
import { AccountStatus, Role } from '@prisma/client'
import { enumInput } from './shared.js'

const password = z
  .string({ required_error: 'Password is required' })
  .min(8, 'Password must be at least 8 characters')
  .max(200, 'Password must be at most 200 characters')

export const createUserSchema = z
  .object({
    name: z.string({ required_error: 'Name is required' }).trim().min(2, 'Name must be at least 2 characters').max(120),
    email: z.string({ required_error: 'Email is required' }).trim().toLowerCase().email('Enter a valid email address'),
    password,
    phone: z.string().trim().max(40).optional().nullable(),
    role: enumInput(Role, 'Role'),
    status: enumInput(AccountStatus, 'Status').optional(),
    joinedDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'joinedDate must be YYYY-MM-DD')
      .optional(),
  })
  .strict()

// Every field optional, but at least one must be supplied.
export const updateUserSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(120).optional(),
    email: z.string().trim().toLowerCase().email('Enter a valid email address').optional(),
    password: password.optional(),
    phone: z.string().trim().max(40).nullable().optional(),
    role: enumInput(Role, 'Role').optional(),
    status: enumInput(AccountStatus, 'Status').optional(),
    joinedDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'joinedDate must be YYYY-MM-DD')
      .optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Provide at least one field to update',
  })

const pagination = {
  page: z.coerce.number().int().min(1, 'page must be 1 or greater').default(1),
  limit: z.coerce.number().int().min(1).max(100, 'limit must be 100 or fewer').default(10),
  search: z.string().trim().max(120).optional(),
  role: enumInput(Role, 'Role').optional(),
  status: enumInput(AccountStatus, 'Status').optional(),
  sort: z.enum(['name', 'joinedDate', 'role', 'createdAt']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
}

export const listUsersQuerySchema = z.object(pagination).strict()

export const idParamSchema = z.object({ id: z.string().trim().min(1, 'id is required') }).strict()