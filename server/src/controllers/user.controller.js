import { sendSuccess } from '../utils/apiResponse.js'
import {
  createUser as createUserRecord,
  deleteUser as deleteUserRecord,
  getUserById,
  listUsers,
  updateUser as updateUserRecord,
} from '../services/user.service.js'

/** GET /api/v1/users */
export async function list(req, res) {
  const result = await listUsers(req.validated.query)
  return sendSuccess(res, { data: result, message: 'OK' })
}

/** GET /api/v1/users/:id */
export async function getOne(req, res) {
  const user = await getUserById(req.validated.params.id)
  return sendSuccess(res, { data: { user }, message: 'OK' })
}

/** POST /api/v1/users */
export async function create(req, res) {
  const user = await createUserRecord(req.validated.body)
  return sendSuccess(res, { data: { user }, message: 'User created', status: 201 })
}

/** PATCH /api/v1/users/:id */
export async function update(req, res) {
  const user = await updateUserRecord(req.validated.params.id, req.validated.body)
  return sendSuccess(res, { data: { user }, message: 'User updated' })
}

/** DELETE /api/v1/users/:id */
export async function remove(req, res) {
  const result = await deleteUserRecord(req.validated.params.id, req.auth.userId)
  return sendSuccess(res, { data: result, message: 'User deleted' })
}