import { Router } from 'express'
import { login, logout, me } from '../controllers/auth.controller.js'
import { requireAuth } from '../middleware/auth.js'
import validate from '../middleware/validate.js'
import asyncHandler from '../utils/asyncHandler.js'
import { loginSchema } from '../validators/auth.validator.js'

const router = Router()

router.post('/login', validate(loginSchema), asyncHandler(login))
router.post('/logout', requireAuth, asyncHandler(logout))
router.get('/me', requireAuth, asyncHandler(me))

export default router