import { Router } from 'express'
import { create, getOne, list, remove, update } from '../controllers/shipment.controller.js'
import { requireAuth, requireOrganization, requireRole } from '../middleware/auth.js'
import validate from '../middleware/validate.js'
import asyncHandler from '../utils/asyncHandler.js'
import {
  createShipmentSchema,
  idParamSchema,
  listShipmentsQuerySchema,
  updateShipmentSchema,
} from '../validators/shipment.validator.js'

const router = Router()

// Authenticated first, then the tenant boundary, then per-route roles. The
// backend is the authority here; the frontend nav filtering is only UX.
router.use(requireAuth)
router.use(requireOrganization)

// Administrator and Operations manage shipments; Finance may read.
const canRead = requireRole('ADMINISTRATOR', 'OPERATIONS', 'FINANCE')
const canManage = requireRole('ADMINISTRATOR', 'OPERATIONS')

router.get('/', canRead, validate(listShipmentsQuerySchema, 'query'), asyncHandler(list))
router.post('/', canManage, validate(createShipmentSchema), asyncHandler(create))
router.get('/:id', canRead, validate(idParamSchema, 'params'), asyncHandler(getOne))
router.patch('/:id', canManage, validate(idParamSchema, 'params'), validate(updateShipmentSchema), asyncHandler(update))
router.delete('/:id', canManage, validate(idParamSchema, 'params'), asyncHandler(remove))

export default router