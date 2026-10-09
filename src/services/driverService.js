// Driver / Hauler service — MoveFlow API-backed (PostgreSQL is the source of truth).
// UI still expects the same data shapes (display names, currentShipmentId, completed count)
// and the legacy sync helpers for details pages that currently call this service.

import { api } from "./api.js";

const BASE = "/drivers";

/**
 * List drivers server-side. The API supports pagination, search, status and
 * verification/vehicleType/licenseStatus filters.
 */
export async function listDrivers({
  page = 1,
  limit = 8,
  search = "",
  status,
  verification,
  vehicleType,
  licenseStatus,
  sort,
  order,
} = {}) {
  const query = api.query({
    page,
    limit,
    search: search.trim() || undefined,
    status,
    verification,
    vehicleType,
    licenseStatus,
    sort,
    order,
  });
  return api.get(`${BASE}${query}`);
}

/** Fetch one driver with relationship summary from the API. */
export async function getDriver(id) {
  try {
    const data = await api.get(`${BASE}/${encodeURIComponent(id)}`);
    return data ?? null;
  } catch (error) {
    if (error?.status === 404) return null;
    throw error;
  }
}

/** @returns {Promise<object>} the created driver DTO. */
export async function createDriver(input) {
  const data = await api.post(BASE, input);
  return data?.driver ?? null;
}

/** PATCH — caller sends only changed fields. */
export async function updateDriver(id, patch) {
  const data = await api.patch(`${BASE}/${encodeURIComponent(id)}`, patch);
  return data?.driver ?? null;
}

/** @returns {Promise<string|null>} the deleted driver's id. */
export async function deleteDriver(id) {
  const data = await api.delete(`${BASE}/${encodeURIComponent(id)}`);
  return data?.id ?? id;
}

/* ----------------------------- Legacy sync helpers ------------------------ */
// These legacy names are still used by older mock-driven pages. Replacements are
// defined below to avoid breaking existing imports while we migrate pages.
export function getDrivers() {
  // Legacy sync API no longer supported. Return empty array to avoid crashes;
  // pages should be rewritten to call listDrivers().
  return [];
}

export function getDriverById() {
  return null;
}

export function addDriver() {
  return null;
}

export function subscribe() {
  return () => {};
}

export function getDriverShipments() {
  return [];
}

export function getCurrentDriverShipment() {
  return null;
}

export function getDriverStats() {
  return { total: 0, active: 0, completed: 0, totalValue: 0 };
}
