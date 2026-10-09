import { sendSuccess } from '../utils/apiResponse.js'
import { getDashboardData } from '../services/dashboard.service.js'

/** GET /api/v1/dashboard */
export async function getDashboard(req, res) {
  const data = await getDashboardData()
  return sendSuccess(res, { data, message: 'OK' })
}