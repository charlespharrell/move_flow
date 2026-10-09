// User service — internal MoveFlow users, backed by the MoveFlow API.
// The backend is the source of truth; there is no local persistence layer.
import { api } from "./api.js";

const BASE = "/users";

/**
 * List users server-side: pagination, search and filters are all resolved by
 * the API so the page never holds more than one page of records.
 *
 * @returns {Promise<{users: object[], pagination: {page:number, limit:number, total:number, totalPages:number}>}>}
 */
export async function listUsers({ page = 1, limit = 8, search = "", role, status, sort, order } = {}) {
  const query = api.query({
    page,
    limit,
    search: search.trim() || undefined,
    role,
    status,
    sort,
    order,
  });
 return api.get(`${BASE}${query || ""}`);
}

/** @returns {Promise<object|null>} the safe user DTO, or null when not found. */
export async function getUser(id) {
  try {
    const data = await api.get(`${BASE}/${encodeURIComponent(id)}`);
    return data?.user ?? null;
  } catch (error) {
    if (error?.status === 404) return null;
    throw error;
  }
}

/** @returns {Promise<object>} the created user DTO. */
export async function createUser(input) {
  const data = await api.post(BASE, input);
  return data?.user ?? null;
}

/** @returns {Promise<object>} the updated user DTO. */
export async function updateUser(id, patch) {
  const data = await api.patch(`${BASE}/${encodeURIComponent(id)}`, patch);
  return data?.user ?? null;
}

/** @returns {Promise<string|null>} the deleted user's id. */
export async function deleteUser(id) {
  const data = await api.delete(`${BASE}/${encodeURIComponent(id)}`);
  return data?.id ?? id;
}

// Role permission matrix — frontend-only UX. The API enforces authorization
// independently (requireAuth + requireRole) on every request.
export const rolePermissions = {
  Administrator: ["Dashboard", "Shipments", "Customers", "Drivers & Haulers", "Payments", "Users", "Settings"],
  Operations: ["Dashboard", "Shipments", "Customers", "Drivers & Haulers", "Settings"],
  Finance: ["Dashboard", "Payments", "Settings"],
};

export function getPermissionsForRole(role) {
  return rolePermissions[role] || [];
}
