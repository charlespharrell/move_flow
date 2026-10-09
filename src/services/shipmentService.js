// Shipment service — MoveFlow API-backed. The backend (PostgreSQL) is the
// source of truth for shipment records; the Shipments pages read and write
// through the API.
//
// `getShipmentTimeline` stays synchronous: it derives timeline events from the
// single shipment row the details page already fetched, without an extra
// backend call.
import { api } from "./api.js";

const BASE = "/shipments";

/**
 * List shipments server-side: the API resolves pagination, search and status
 * filtering so the page never holds more than one page of records.
 *
 * @returns {Promise<{shipments: object[], pagination: {page:number, limit:number, total:number, totalPages:number}>}>}
 */
export async function listShipments({ page = 1, limit = 8, search = "", status, customer, driver, sort, order } = {}) {
  const query = api.query({
    page,
    limit,
    search: search.trim() || undefined,
    status,
    customer,
    driver,
    sort,
    order,
  });
  return api.get(`${BASE}${query}`);
}

/**
 * Fetch one shipment from the API.
 *
 * @returns {Promise<object|null>} the shipment DTO, or null when the API
 *   reports it does not exist (404).
 */
export async function getShipment(id) {
  try {
    const data = await api.get(`${BASE}/${encodeURIComponent(id)}`);
    return data?.shipment ?? null;
  } catch (error) {
    if (error?.status === 404) return null;
    throw error;
  }
}

/** @returns {Promise<object>} the created shipment DTO. */
export async function createShipment(input) {
  const data = await api.post(BASE, input);
  return data?.shipment ?? null;
}

/** PATCH — the caller sends only the fields that were edited. */
export async function updateShipment(id, patch) {
  const data = await api.patch(`${BASE}/${encodeURIComponent(id)}`, patch);
  return data?.shipment ?? null;
}

/** @returns {Promise<string|null>} the deleted shipment's id. */
export async function deleteShipment(id) {
  const data = await api.delete(`${BASE}/${encodeURIComponent(id)}`);
  return data?.id ?? id;
}

/**
 * Reference lists the create/edit form needs to populate its customer and
 * driver dropdowns, fetched from the same API. Drivers carry the display names
 * and vehicle types the labels render.
 *
 * @returns {Promise<{customers: object[], drivers: object[]}>}
 */
export async function getShipmentFormReference() {
  const [customers, drivers] = await Promise.all([
    api.get(`/customers?${api.query({ limit: 100 })}`),
    api.get(`/drivers?${api.query({ limit: 100 })}`),
  ]);
  return { customers: customers?.customers ?? [], drivers: drivers?.drivers ?? [] };
}

// Build timeline events based on shipment status
export function getShipmentTimeline(shipment) {
  const events = [];

  // Shipment created — always
  events.push({
    id: "created",
    title: "Shipment created",
    description: `Created on ${shipment.createdAt} · ${shipment.origin} → ${shipment.destination}`,
    date: shipment.createdAt,
    done: true,
  });

  if (shipment.status === "Cancelled") {
    events.push({
      id: "cancelled",
      title: "Shipment cancelled",
      description: "This shipment was cancelled before dispatch",
      date: shipment.createdAt,
      done: true,
      variant: "cancelled",
    });
    return events;
  }

  if (["Assigned", "In Transit", "Delivered"].includes(shipment.status)) {
    events.push({
      id: "assigned",
      title: "Driver assigned",
      description: shipment.driver
        ? `${shipment.driver} · ${shipment.vehicle || "Vehicle assigned"}`
        : "Awaiting driver assignment",
      date: shipment.pickupDate || shipment.createdAt,
      done: !!shipment.driver,
    });
  } else {
    events.push({
      id: "awaiting",
      title: "Awaiting assignment",
      description: "Shipment is pending driver assignment",
      date: null,
      done: false,
    });
  }

  if (["In Transit", "Delivered"].includes(shipment.status)) {
    events.push({
      id: "pickup",
      title: "Pickup completed",
      description: `Picked up at ${shipment.origin} — ${shipment.pickupDate || shipment.createdAt}`,
      date: shipment.pickupDate,
      done: true,
    });
    events.push({
      id: "transit",
      title: "In transit",
      description: `Current location: ${shipment.currentLocation}`,
      date: shipment.pickupDate,
      done: true,
    });
  }

  if (shipment.status === "Delivered") {
    events.push({
      id: "delivered",
      title: "Delivered",
      description: `Delivered to ${shipment.destination} — ${shipment.actualDeliveryDate}`,
      date: shipment.actualDeliveryDate,
      done: true,
    });
  }

  if (shipment.status === "Assigned") {
    events.push({
      id: "pickup-pending",
      title: "Awaiting pickup",
      description: `Scheduled pickup — ${shipment.pickupDate || shipment.expectedDeliveryDate}`,
      date: shipment.pickupDate,
      done: false,
    });
  }

  return events;
}