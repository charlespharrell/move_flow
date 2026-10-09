/**
 * Operational (expected) error: something a client did wrong, or a known
 * missing record. The error handler surfaces these messages as-is.
 *
 * Anything that is NOT an AppError is treated as unexpected and reported to
 * the client as a generic 500 so internals never leak.
 */
export class AppError extends Error {
  constructor(message, { status = 500, details, cause } = {}) {
    super(message, cause ? { cause } : undefined)
    this.name = 'AppError'
    this.status = status
    this.details = details
    this.isOperational = true
    Error.captureStackTrace?.(this, AppError)
  }

  static badRequest(message, details) {
    return new AppError(message, { status: 400, details })
  }

  static unauthorized(message = 'Authentication required') {
    return new AppError(message, { status: 401 })
  }

  static forbidden(message = 'You do not have access to this resource') {
    return new AppError(message, { status: 403 })
  }

  static notFound(message = 'Resource not found') {
    return new AppError(message, { status: 404 })
  }

  static conflict(message, details) {
    return new AppError(message, { status: 409, details })
  }
}

export default AppError