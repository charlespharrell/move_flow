import express from 'express'
import cors from 'cors'
import morgan from 'morgan'

import { env } from './config/index.js'
import apiRoutes from './routes/index.js'
import { notFound, errorHandler } from './middleware/error.js'

const app = express()

// Do not advertise the framework.
app.disable('x-powered-by')

// Parse JSON and form bodies with a hard size cap.
app.use(express.json({ limit: '100kb' }))
app.use(express.urlencoded({ extended: false, limit: '100kb' }))

app.use(
  cors({
    origin: env.clientOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 600,
  }),
)

if (!env.isTest) {
  // `safe-url` drops the query string, so tokens or emails passed as query
  // parameters are never written to the logs.
  morgan.token('safe-url', (req) => req.originalUrl.split('?')[0])
  app.use(morgan(':method :safe-url :status :response-time ms'))
}

app.use(env.apiPrefix, apiRoutes)

app.use(notFound)
app.use(errorHandler)

export { app }
export default app