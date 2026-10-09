import jwt from 'jsonwebtoken'
import { env } from '../config/index.js'

/**
 * The payload carries only identity: no email, no name, no password material.
 * Role and organization are included for cheap client-side presentation, but
 * authorization is always re-checked against the database via requireAuth.
 */
export function signAccessToken({ userId, role, organizationId }) {
  return jwt.sign({ role, org: organizationId }, env.jwtSecret, {
    subject: userId,
    expiresIn: env.jwtExpiresIn,
    issuer: env.jwtIssuer,
    audience: env.jwtAudience,
  })
}

export class TokenError extends Error {
  constructor(message, code) {
    super(message)
    this.name = 'TokenError'
    this.code = code
  }
}

export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, env.jwtSecret, {
      issuer: env.jwtIssuer,
      audience: env.jwtAudience,
    })
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new TokenError('Session has expired', 'TOKEN_EXPIRED')
    }
    throw new TokenError('Invalid authentication token', 'TOKEN_INVALID')
  }
}