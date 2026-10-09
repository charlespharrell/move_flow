import { Router } from 'express'
import { health, healthWithDatabase } from '../controllers/health.controller.js'

const router = Router()

router.get('/', health)
router.get('/database', healthWithDatabase)

export default router