import AppError from '../utils/AppError.js'
import { formatIssues } from '../validators/shared.js'

/**
 * Validates one part of the request against a Zod schema and stores the parsed
 * result on `req.validated`. Express 5 exposes `req.query` as a getter, so the
 * parsed output deliberately goes to a plain own property instead.
 */
export function validate(schema, source = 'body') {
  return function validateRequest(req, res, next) {
    const result = schema.safeParse(req[source])

    if (!result.success) {
      return next(
        AppError.badRequest('Validation failed', {
          source,
          issues: formatIssues(result.error),
        }),
      )
    }

    req.validated = { ...req.validated, [source]: result.data }
    next()
  }
}

export default validate