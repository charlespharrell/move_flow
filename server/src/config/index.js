import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')

dotenv.config({ path: path.join(serverRoot, '.env') })

const NODE_ENV = process.env.NODE_ENV || 'development'
const isProduction = NODE_ENV === 'production'
const isTest = NODE_ENV === 'test'

function required(name, { minLength = 1 } = {}) {
  const value = process.env[name]
  if (!value || value.length < minLength) {
    throw new Error(
      `Missing required environment variable ${name}. ` +
        `Copy server/.env.example to server/.env before starting the API.`,
    )
  }
  return value
}

function parseOrigins(raw) {
  const fallback = ['http://localhost:5173', 'http://127.0.0.1:5173']
  if (!raw) return fallback
  const origins = raw
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean)
  return origins.length > 0 ? origins : fallback
}

const DEFAULT_PORT = 5000

function parsePort(raw) {
  if (raw === undefined || raw === null || raw.trim() === '') return DEFAULT_PORT
  const port = Number.parseInt(raw, 10)
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid PORT "${raw}". Expected an integer between 1 and 65535.`)
  }
  return port
}

// DATABASE_URL is required in every environment: Prisma cannot connect without it.
const databaseUrl = required('DATABASE_URL')

// JWT signing is a later phase, but the secret must be present and non-trivial
// from day one so the app never boots with a placeholder value.
const jwtSecret = required('JWT_SECRET', { minLength: isProduction ? 32 : 8 })

if (isProduction && jwtSecret.startsWith('replace-me')) {
  throw new Error('JWT_SECRET still holds the .env.example placeholder value.')
}

export const env = Object.freeze({
  nodeEnv: NODE_ENV,
  isProduction,
  isTest,
  isDevelopment: !isProduction && !isTest,
  port: parsePort(process.env.PORT),
  databaseUrl,
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  jwtIssuer: 'moveflow-api',
  jwtAudience: 'moveflow-admin',
  bcryptRounds: Number.parseInt(process.env.BCRYPT_ROUNDS ?? '', 10) || 10,
  clientOrigins: parseOrigins(process.env.CLIENT_URL),
  apiPrefix: '/api/v1',
})

export default env