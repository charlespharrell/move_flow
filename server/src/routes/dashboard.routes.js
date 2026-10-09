import { Router } from 'express'
import { getDashboard } from '../controllers/dashboard.controller.js'
import { requireAuth, requireOrganization, requireRole } from '../middleware/auth.js'
import asyncHandler from '../utils/asyncHandler.js'

const router = Router()

// Authenticated first, then the tenant boundary, then role gating.
router.use(requireAuth)
router.use(requireOrganization)

// Dashboard is available to every platform role: Administrator, Operations,
// Finance. No query parameters exist in the current contract, so no validation
// middleware is needed here.
const canRead = requireRole('ADMINISTRATOR', 'OPERATIONS', 'FINANCE')

router.get('/', canRead, asyncHandler(getDashboard))

export default router