import { sendSuccess } from '../utils/apiResponse.js'
import { issueSession, verifyCredentials } from '../services/auth.service.js'

/** POST /api/v1/auth/login */
export async function login(req, res) {
  const { email, password } = req.validated.body
  const user = await verifyCredentials(email, password)
  const session = await issueSession(user)

  return sendSuccess(res, {
    data: session,
    message: 'Signed in successfully',
  })
}

/** GET /api/v1/auth/me — user is re-read from the database by requireAuth. */
export function me(req, res) {
  return sendSuccess(res, {
    data: { user: req.user },
    message: 'OK',
  })
}

/**
 * POST /api/v1/auth/logout
 *
 * Stateless JWTs cannot be revoked without server-side token state, which this
 * phase deliberately does not introduce. The endpoint exists so the client has
 * a single place to acknowledge sign-out; the real work is the client discarding
 * the token. A token captured before logout remains valid until it expires.
 */
export function logout(_req, res) {
  return sendSuccess(res, {
    data: null,
    message: 'Signed out',
  })
}