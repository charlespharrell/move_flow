import prisma from '../lib/prisma.js'

/**
 * Liveness only: proves the HTTP process is serving. Deliberately does not
 * touch the database so it stays useful when Postgres is down.
 */
export function health(_req, res) {
  return res.status(200).json({
    success: true,
    message: 'MoveFlow API is running',
  })
}

/**
 * Readiness: additionally verifies the Prisma connection with a single
 * read-only statement. Never mutates data.
 */
export async function healthWithDatabase(_req, res) {
  try {
    await prisma.$queryRaw`SELECT 1`
    return res.status(200).json({
      success: true,
      message: 'MoveFlow API is running',
      data: {
        database: 'reachable',
        environment: process.env.NODE_ENV || 'development',
        uptimeSeconds: Math.round(process.uptime()),
      },
    })
  } catch {
    return res.status(503).json({
      success: false,
      message: 'Database is unreachable',
    })
  }
}