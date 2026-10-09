import { sendSuccess } from '../utils/apiResponse.js'
import {
  createDriver as createDriverRecord,
  deleteDriver as deleteDriverRecord,
  getDriverById,
  getDriverRelationship,
  listDrivers,
  updateDriver as updateDriverRecord,
} from '../services/driver.service.js'

/** GET /api/v1/drivers */
export async function list(req, res) {
  const result = await listDrivers(req.validated.query)
  return sendSuccess(res, { data: result, message: 'OK' })
}

/** GET /api/v1/drivers/:id */
export async function getOne(req, res) {
  const id = req.validated.params.id
  const [driver, related] = await Promise.all([getDriverById(id), getDriverRelationship(id)])
  return sendSuccess(res, { data: { driver, related }, message: 'OK' })
}

/** POST /api/v1/drivers */
export async function create(req, res) {
  const driver = await createDriverRecord(req.validated.body, req.auth.userId)
  return sendSuccess(res, { data: { driver }, message: 'Driver created', status: 201 })
}

/** PATCH /api/v1/drivers/:id */
export async function update(req, res) {
  const driver = await updateDriverRecord(req.validated.params.id, req.validated.body, req.auth.userId)
  return sendSuccess(res, { data: { driver }, message: 'Driver updated' })
}

/** DELETE /api/v1/drivers/:id */
export async function remove(req, res) {
  const result = await deleteDriverRecord(req.validated.params.id)
  return sendSuccess(res, { data: result, message: 'Driver deleted' })
}