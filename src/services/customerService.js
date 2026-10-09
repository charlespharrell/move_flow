// Customer service — MoveFlow API-backed. The backend is the source of truth
// for customer records and their shipment aggregates (`shipmentStats` on list
// rows, `related.shipments` on the detail response); the shipment history
// itself is fetched from the Shipments API. No localStorage persistence.
import { api } from "./api.js";

const BASE = "/customers";

/**
 * List customers server-side: pagination, search and status filtering are all
 * resolved by the API so the page never holds more than one page of records.
 *
 * @returns {Promise<{customers: object[], pagination: {page:number, limit:number, total:number, totalPages:number}>}>}
 */
export async function listCustomers({ page = 1, limit = 8, search = "", status, sort, order } = {}) {
  const query = api.query({
    page,
    limit,
    search: search.trim() || undefined,
    status,
    sort,
    order,
  });
  return api.get(`${BASE}${query}`);
}

/**
 * Fetch one customer plus its shipment relationship summary.
 *
 * @returns {Promise<{customer: object, related: {shipments: object}}|null>} null
 *   when the API reports the customer does not exist (404).
 */
export async function getCustomer(id) {
  try {
    const data = await api.get(`${BASE}/${encodeURIComponent(id)}`);
    return { customer: data?.customer ?? null, related: data?.related ?? null };
  } catch (error) {
    if (error?.status === 404) return null;
    throw error;
  }
}

/** @returns {Promise<object>} the created customer DTO. */
export async function createCustomer(input) {
  const data = await api.post(BASE, input);
  return data?.customer ?? null;
}

/** PATCH — the caller sends only the fields that were edited. */
export async function updateCustomer(id, patch) {
  const data = await api.patch(`${BASE}/${encodeURIComponent(id)}`, patch);
  return data?.customer ?? null;
}

/** @returns {Promise<string|null>} the deleted customer's id. */
export async function deleteCustomer(id) {
  const data = await api.delete(`${BASE}/${encodeURIComponent(id)}`);
  return data?.id ?? id;
}
