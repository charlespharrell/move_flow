import app from './app.js'
import { env } from './config/index.js'
import { prisma, disconnectDatabase } from './lib/prisma.js'
import logger from './utils/logger.js'

const server = app.listen(env.port, () => {
  logger.info('MoveFlow API started', {
    port: env.port,
    environment: env.nodeEnv,
    apiPrefix: env.apiPrefix,
  })
})

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    logger.error(`Port ${env.port} is already in use`, { code: error.code })
  } else {
    logger.error('HTTP server failed to start', { message: error.message, code: error.code })
  }
  process.exit(1)
})

// Prisma connects lazily, so opening the pool here only proves reachability.
// It is intentionally non-fatal: a cold database must not stop the API from
// serving /api/v1/health, and nothing here writes to or migrates the database.
prisma
  .$connect()
  .then(() => logger.info('Database connection established'))
  .catch((error) => logger.error('Database connection failed', { message: error.message }))

let shuttingDown = false

async function shutdown(signal) {
  if (shuttingDown) return
  shuttingDown = true
  logger.info('Shutting down', { signal })

  server.close(async (error) => {
    if (error) logger.error('Error while closing HTTP server', { message: error.message })
    try {
      await disconnectDatabase()
    } catch (disconnectError) {
      logger.error('Error while disconnecting database', { message: disconnectError.message })
    }
    process.exit(error ? 1 : 0)
  })

  // Do not hang forever on lingering keep-alive sockets.
  setTimeout(() => process.exit(1), 10000).unref()
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', {
    message: reason instanceof Error ? reason.message : String(reason),
  })
})
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { message: error.message, stack: error.stack })
  shutdown('uncaughtException')
})

export default server