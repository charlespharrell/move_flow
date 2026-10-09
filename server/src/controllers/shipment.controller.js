import { sendSuccess } from '../utils/apiResponse.js'
import {
  createShipment as createShipmentRecord,
  deleteShipment as deleteShipmentRecord,
  getShipmentById,
  listShipments,
  updateShipment as updateShipmentRecord,
} from '../services/shipment.service.js'

/** GET /api/v1/shipments */
export async function list(req, res) {
  const result = await listShipments(req.validated.query)
  return sendSuccess(res, { data: result, message: 'OK' })
}

/** GET /api/v1/shipments/:id */
export async function getOne(req, res) {
  const shipment = await getShipmentById(req.validated.params.id)
  return sendSuccess(res, { data: { shipment }, message: 'OK' })
}

/** POST /api/v1/shipments */
export async function create(req, res) {
  const shipment = await createShipmentRecord(req.validated.body, req.auth.userId)
  return sendSuccess(res, { data: { shipment }, message: 'Shipment created', status: 201 })
}

/** PATCH /api/v1/shipments/:id */
export async function update(req, res) {
  const shipment = await updateShipmentRecord(req.validated.params.id, req.validated.body, req.auth.userId)
  return sendSuccess(res, { data: { shipment }, message: 'Shipment updated' })
}

/** DELETE /api/v1/shipments/:id */
export async function remove(req, res) {
  const result = await deleteShipmentRecord(req.validated.params.id)
  return sendSuccess(res, { data: result, message: 'Shipment deleted' })
}