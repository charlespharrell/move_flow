import { Router } from 'express'
import healthRoutes from './health.routes.js'
import authRoutes from './auth.routes.js'
import userRoutes from './user.routes.js'
import customerRoutes from './customer.routes.js'
import shipmentRoutes from './shipment.routes.js'
import driverRoutes from './driver.routes.js'
import paymentRoutes from './payment.routes.js'
import dashboardRoutes from './dashboard.routes.js'

const router = Router()

// Mounted at env.apiPrefix by app.js. Feature routers are added here as they
// are built out in later phases.
router.use('/health', healthRoutes)
router.use('/auth', authRoutes)
router.use('/users', userRoutes)
router.use('/customers', customerRoutes)
router.use('/shipments', shipmentRoutes)
router.use('/drivers', driverRoutes)
router.use('/payments', paymentRoutes)
router.use('/dashboard', dashboardRoutes)

export default router