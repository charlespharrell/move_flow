import { Router } from 'express'
import { create, getOne, list, remove, update } from '../controllers/payment.controller.js'
import { requireAuth, requireOrganization, requireRole } from '../middleware/auth.js'
import validate from '../middleware/validate.js'
import asyncHandler from '../utils/asyncHandler.js'
import {
  createPaymentSchema,
  idParamSchema,
  listPaymentsQuerySchema,
  updatePaymentSchema,
} from '../validators/payment.validator.js'

const router = Router()

// Authenticated first, then the tenant boundary, then per-route roles. The
// backend is the authority here; the frontend nav filtering is only UX.
router.use(requireAuth)
router.use(requireOrganization)

// Payments are a finance-owned domain: every platform role (Administrator,
// Operations, Finance) may read and manage them. Unlike customers/shipments/
// drivers — where Finance is read-only — the Payments permission matrix grants
// Finance full CRUD, and the existing frontend exposes no mutation UI anyway.
const canRead = requireRole('ADMINISTRATOR', 'OPERATIONS', 'FINANCE')
const canManage = requireRole('ADMINISTRATOR', 'OPERATIONS', 'FINANCE')

router.get('/', canRead, validate(listPaymentsQuerySchema, 'query'), asyncHandler(list))
router.post('/', canManage, validate(createPaymentSchema), asyncHandler(create))
router.get('/:id', canRead, validate(idParamSchema, 'params'), asyncHandler(getOne))
router.patch('/:id', canManage, validate(idParamSchema, 'params'), validate(updatePaymentSchema), asyncHandler(update))
router.delete('/:id', canManage, validate(idParamSchema, 'params'), asyncHandler(remove))

export default router