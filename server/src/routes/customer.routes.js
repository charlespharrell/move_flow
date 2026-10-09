import { Router } from 'express'
import { create, getOne, list, remove, update } from '../controllers/customer.controller.js'
import { requireAuth, requireOrganization, requireRole } from '../middleware/auth.js'
import validate from '../middleware/validate.js'
import asyncHandler from '../utils/asyncHandler.js'
import {
  createCustomerSchema,
  idParamSchema,
  listCustomersQuerySchema,
  updateCustomerSchema,
} from '../validators/customer.validator.js'

const router = Router()

// Authenticated first, then the tenant boundary, then per-route roles. The
// backend is the authority here; the frontend nav filtering is only UX.
router.use(requireAuth)
router.use(requireOrganization)

// Administrator and Operations manage customers; Finance may read.
const canRead = requireRole('ADMINISTRATOR', 'OPERATIONS', 'FINANCE')
const canManage = requireRole('ADMINISTRATOR', 'OPERATIONS')

router.get('/', canRead, validate(listCustomersQuerySchema, 'query'), asyncHandler(list))
router.post('/', canManage, validate(createCustomerSchema), asyncHandler(create))
router.get('/:id', canRead, validate(idParamSchema, 'params'), asyncHandler(getOne))
router.patch('/:id', canManage, validate(idParamSchema, 'params'), validate(updateCustomerSchema), asyncHandler(update))
router.delete('/:id', canManage, validate(idParamSchema, 'params'), asyncHandler(remove))

export default router
