import { env } from '../config/index.js'
import logger from '../utils/logger.js'

export function notFound(req, res, next) {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`)
  error.status = 404
  error.isOperational = true
  next(error)
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error)

  const status = resolveStatus(error)
  const isOperational = error.isOperational === true

  if (!isOperational || status >= 500) {
    logger.error('Request failed', {
      method: req.method,
      path: req.originalUrl,
      status,
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack,
    })
  }

  const message = isOperational && error.message ? error.message : publicMessage(status)

  res.status(status).json({
    success: false,
    message,
    ...(isOperational && error.details !== undefined ? { errors: error.details } : {}),
    // Stacks are a development affordance only; never emitted in production.
    ...(env.isProduction ? {} : { stack: error.stack }),
  })
}

function resolveStatus(error) {
  const declared = Number(error.status ?? error.statusCode)
  if (Number.isInteger(declared) && declared >= 400 && declared <= 599) return declared

  // Body parser failures for malformed or oversized JSON.
  if (error.type === 'entity.parse.failed') return 400
  if (error.type === 'entity.too.large') return 413

  return resolvePrismaStatus(error) ?? 500
}

function resolvePrismaStatus(error) {
  const code = error?.code
  if (typeof code !== 'string' || !code.startsWith('P')) return null

  switch (code) {
    case 'P1001':
    case 'P1002':
    case 'P1017':
      return 503
    case 'P2002':
    case 'P2014':
    case 'P3006':
      return 409
    case 'P2003':
      return 400
    case 'P2025':
      return 404
    default:
      return 500
  }
}

function publicMessage(status) {
  switch (status) {
    case 400:
      return 'Malformed request'
    case 404:
      return 'Resource not found'
    case 409:
      return 'Conflicting request'
    case 413:
      return 'Request body too large'
    case 503:
      return 'Service temporarily unavailable'
    default:
      return 'Something went wrong'
  }
}