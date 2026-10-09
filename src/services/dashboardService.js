// Dashboard service — MoveFlow API-backed. One request returns every section
// the Dashboard renders: summary metrics, status distribution, monthly shipment
// and revenue trends, recent shipments and recent activity.
import { api } from "./api.js";

const BASE = "/dashboard";

/**
 * Fetch the full dashboard payload.
 *
 * @returns {Promise<{
 *   summary: object,
 *   shipmentStatusDistribution: object[],
 *   shipmentTrend: object[],
 *   revenueTrend: object[],
 *   recentShipments: object[],
 *   recentActivity: object[],
 * }>}
 */
export async function getDashboard() {
  return api.get(BASE);
}

export default getDashboard;