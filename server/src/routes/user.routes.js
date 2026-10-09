import { Router } from 'express'
import { create, getOne, list, remove, update } from '../controllers/user.controller.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import validate from '../middleware/validate.js'
import asyncHandler from '../utils/asyncHandler.js'
import {
  createUserSchema,
  idParamSchema,
  listUsersQuerySchema,
  updateUserSchema,
} from '../validators/user.validator.js'

const router = Router()

// Every Users route is authenticated, then restricted to Administrators. The
// backend is the authority here; the frontend nav filtering is only UX.
router.use(requireAuth)
router.use(requireRole('ADMINISTRATOR'))

router.get('/', validate(listUsersQuerySchema, 'query'), asyncHandler(list))
router.post('/', validate(createUserSchema), asyncHandler(create))
router.get('/:id', validate(idParamSchema, 'params'), asyncHandler(getOne))
router.patch('/:id', validate(idParamSchema, 'params'), validate(updateUserSchema), asyncHandler(update))
router.delete('/:id', validate(idParamSchema, 'params'), asyncHandler(remove))

export default router