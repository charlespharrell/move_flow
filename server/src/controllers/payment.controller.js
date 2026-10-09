import { sendSuccess } from '../utils/apiResponse.js'
import {
  createPayment as createPaymentRecord,
  deletePayment as deletePaymentRecord,
  getPaymentById,
  getPaymentRelationship,
  listPayments,
  updatePayment as updatePaymentRecord,
} from '../services/payment.service.js'

/** GET /api/v1/payments */
export async function list(req, res) {
  const result = await listPayments(req.validated.query)
  return sendSuccess(res, { data: result, message: 'OK' })
}

/** GET /api/v1/payments/:id */
export async function getOne(req, res) {
  const id = req.validated.params.id
  const [payment, related] = await Promise.all([getPaymentById(id), getPaymentRelationship(id)])
  return sendSuccess(res, { data: { payment, related }, message: 'OK' })
}

/** POST /api/v1/payments */
export async function create(req, res) {
  const payment = await createPaymentRecord(req.validated.body, req.auth.userId)
  return sendSuccess(res, { data: { payment }, message: 'Payment created', status: 201 })
}

/** PATCH /api/v1/payments/:id */
export async function update(req, res) {
  const payment = await updatePaymentRecord(req.validated.params.id, req.validated.body, req.auth.userId)
  return sendSuccess(res, { data: { payment }, message: 'Payment updated' })
}

/** DELETE /api/v1/payments/:id */
export async function remove(req, res) {
  const result = await deletePaymentRecord(req.validated.params.id)
  return sendSuccess(res, { data: result, message: 'Payment deleted' })
}