import { Router } from 'express'
import { create, getOne, list, remove, update } from '../controllers/driver.controller.js'
import { requireAuth, requireOrganization, requireRole } from '../middleware/auth.js'
import validate from '../middleware/validate.js'
import asyncHandler from '../utils/asyncHandler.js'
import {
  createDriverSchema,
  idParamSchema,
  listDriversQuerySchema,
  updateDriverSchema,
} from '../validators/driver.validator.js'

const router = Router()

// Authenticated first, then the tenant boundary, then per-route roles. The
// backend is the authority here; the frontend nav filtering is only UX.
router.use(requireAuth)
router.use(requireOrganization)

// Administrator and Operations manage drivers/haulers; Finance may read.
const canRead = requireRole('ADMINISTRATOR', 'OPERATIONS', 'FINANCE')
const canManage = requireRole('ADMINISTRATOR', 'OPERATIONS')

router.get('/', canRead, validate(listDriversQuerySchema, 'query'), asyncHandler(list))
router.post('/', canManage, validate(createDriverSchema), asyncHandler(create))
router.get('/:id', canRead, validate(idParamSchema, 'params'), asyncHandler(getOne))
router.patch('/:id', canManage, validate(idParamSchema, 'params'), validate(updateDriverSchema), asyncHandler(update))
router.delete('/:id', canManage, validate(idParamSchema, 'params'), asyncHandler(remove))

export default router