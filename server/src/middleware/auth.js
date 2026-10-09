import prisma from '../lib/prisma.js'
import AppError from '../utils/AppError.js'
import asyncHandler from '../utils/asyncHandler.js'
import { TokenError, verifyAccessToken } from '../utils/jwt.js'
import { serializeUser } from '../services/auth.service.js'

function extractBearerToken(req) {
  const header = req.headers.authorization
  if (typeof header !== 'string' || !header.startsWith('Bearer ')) return null
  const token = header.slice('Bearer '.length).trim()
  return token.length > 0 ? token : null
}

/**
 * Verifies the bearer token, then re-reads the user from the database so role
 * changes and deactivations take effect immediately instead of lingering until
 * an already-issued token expires.
 */
export const requireAuth = asyncHandler(async (req, res, next) => {
  const token = extractBearerToken(req)
  if (!token) {
    throw AppError.unauthorized('Authentication required')
  }

  let payload
  try {
    payload = verifyAccessToken(token)
  } catch (error) {
    if (error instanceof TokenError) {
      throw AppError.unauthorized(error.message)
    }
    throw error
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } })
  if (!user) {
    throw AppError.unauthorized('Session is no longer valid')
  }
  if (user.status !== 'ACTIVE') {
    throw AppError.unauthorized('This account is inactive')
  }

  // `req.user` is safe to serialize; `req.auth.role` stays in raw enum form for
  // role comparisons.
  req.user = serializeUser(user)
  req.auth = {
    userId: user.id,
    role: user.role,
    organizationId: payload.org ?? null,
  }

  next()
})

/**
 * Must run after requireAuth. Accepts raw Prisma enum members, e.g.
 * requireRole('ADMINISTRATOR').
 */
export function requireRole(...allowedRoles) {
  return function authorizeRole(req, res, next) {
    if (!req.auth) {
      return next(AppError.unauthorized('Authentication required'))
    }
    if (!allowedRoles.includes(req.auth.role)) {
      return next(AppError.forbidden('You do not have permission to perform this action'))
    }
    next()
  }
}

/**
 * Tenant boundary. This deployment's schema is single-organization: one
 * Organization row owns every customer record, so a customer can only be read
 * or written by a session minted for that same organization. Must run after
 * requireAuth (it reads req.auth.organizationId).
 */
export const requireOrganization = asyncHandler(async (req, res, next) => {
  const organization = await prisma.organization.findFirst({
    select: { id: true },
    orderBy: { id: 'asc' },
  })

  if (!organization) {
    throw AppError.forbidden('No organization is configured for this deployment')
  }
  if (!req.auth?.organizationId || req.auth.organizationId !== organization.id) {
    throw AppError.forbidden('You do not have access to this organization data')
  }

  next()
})