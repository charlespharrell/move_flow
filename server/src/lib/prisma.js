import { PrismaClient } from '@prisma/client'
import { env } from '../config/index.js'

// Reuse a single client across module reloads so `node --watch` does not leak
// connection pools on every restart. Never cache in production, where one
// instance per process is correct.
const globalForPrisma = globalThis

export const prisma =
  globalForPrisma.__moveflowPrisma ??
  new PrismaClient({
    // 'query' logging would echo SQL parameters (names, emails, amounts) into
    // stdout, so it is deliberately not enabled.
    log: env.isProduction ? ['warn', 'error'] : ['warn', 'error'],
  })

if (!env.isProduction) globalForPrisma.__moveflowPrisma = prisma

export async function connectDatabase() {
  await prisma.$connect()
}

export async function disconnectDatabase() {
  await prisma.$disconnect()
}

export default prisma