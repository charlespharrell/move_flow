import bcrypt from 'bcryptjs'
import prisma from '../lib/prisma.js'
import { env } from '../config/index.js'
import AppError from '../utils/AppError.js'
import { humanizeEnum, toDateOnly } from '../utils/enums.js'
import { signAccessToken } from '../utils/jwt.js'

/**
 * Single generic message for both "no such email" and "wrong password", so the
 * endpoint cannot be used to enumerate accounts.
 */
const INVALID_CREDENTIALS = 'Invalid email or password'

/**
 * A throwaway hash compared against when the email is unknown, so a missing
 * account costs the same wall-clock time as a wrong password. Generated once
 * per process and discarded on restart.
 */
let timingEqualiserHash = null

function getTimingEqualiserHash() {
  timingEqualiserHash ??= bcrypt.hashSync('moveflow-timing-equaliser', env.bcryptRounds)
  return timingEqualiserHash
}

export async function verifyCredentials(email, password) {
  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } })

  if (!user) {
    await bcrypt.compare(password, getTimingEqualiserHash())
    throw AppError.unauthorized(INVALID_CREDENTIALS)
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash)
  if (!passwordMatches) {
    throw AppError.unauthorized(INVALID_CREDENTIALS)
  }

  // Only reachable with the correct password, so naming the reason here does
  // not leak whether the account exists.
  if (user.status !== 'ACTIVE') {
    throw AppError.unauthorized('This account is inactive. Contact an administrator.')
  }

  return user
}

export async function issueSession(user) {
  // Single-organization schema: one row carries the tenant identity.
  const organization = await prisma.organization.findFirst({
    select: { id: true },
    orderBy: { id: 'asc' },
  })

  const token = signAccessToken({
    userId: user.id,
    role: user.role,
    organizationId: organization?.id ?? null,
  })

  return { token, user: serializeUser(user) }
}

export async function getUserForAuth(userId) {
  return prisma.user.findUnique({ where: { id: userId } })
}

export function serializeUser(user) {
  if (!user) return null
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone ?? null,
    role: humanizeEnum(user.role),
    status: humanizeEnum(user.status),
    joinedDate: toDateOnly(user.joinedDate),
    lastActive: toDateOnly(user.lastActive),
    createdAt: toDateOnly(user.createdAt),
    updatedAt: toDateOnly(user.updatedAt),
  }
}

export function hashPassword(plainText) {
  return bcrypt.hash(plainText, env.bcryptRounds)
}