import { sendSuccess } from '../utils/apiResponse.js'
import {
  createCustomer as createCustomerRecord,
  deleteCustomer as deleteCustomerRecord,
  getCustomerById,
  getCustomerRelationship,
  listCustomers,
  updateCustomer as updateCustomerRecord,
} from '../services/customer.service.js'

/** GET /api/v1/customers */
export async function list(req, res) {
  const result = await listCustomers(req.validated.query)
  return sendSuccess(res, { data: result, message: 'OK' })
}

/** GET /api/v1/customers/:id */
export async function getOne(req, res) {
  const id = req.validated.params.id
  const [customer, related] = await Promise.all([getCustomerById(id), getCustomerRelationship(id)])
  return sendSuccess(res, { data: { customer, related }, message: 'OK' })
}

/** POST /api/v1/customers */
export async function create(req, res) {
  const customer = await createCustomerRecord(req.validated.body)
  return sendSuccess(res, { data: { customer }, message: 'Customer created', status: 201 })
}

/** PATCH /api/v1/customers/:id */
export async function update(req, res) {
  const customer = await updateCustomerRecord(req.validated.params.id, req.validated.body)
  return sendSuccess(res, { data: { customer }, message: 'Customer updated' })
}

/** DELETE /api/v1/customers/:id */
export async function remove(req, res) {
  const result = await deleteCustomerRecord(req.validated.params.id)
  return sendSuccess(res, { data: result, message: 'Customer deleted' })
}
