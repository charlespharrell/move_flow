import prisma from '../lib/prisma.js'
import AppError from '../utils/AppError.js'
import { hashPassword, serializeUser } from './auth.service.js'

const USER_PREFIX = 'USR-'

/** User.id has no default in the schema, so IDs are generated here. */
async function nextUserId() {
  const users = await prisma.user.findMany({ select: { id: true } })
  const highest = users.reduce((max, user) => {
    if (!user.id.startsWith(USER_PREFIX)) return max
    const numeric = Number.parseInt(user.id.slice(USER_PREFIX.length), 10)
    return Number.isInteger(numeric) && numeric > max ? numeric : max
  }, 0)

  return `${USER_PREFIX}${String(highest + 1).padStart(3, '0')}`
}

export { serializeUser }

export async function listUsers({ page, limit, search, role, status, sort, order }) {
  const where = {}

  if (search) {
    // Insensitive partial match across the fields the UI searches on.
    where.OR = [
      { id: { contains: search, mode: 'insensitive' } },
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
    ]
  }
  if (role) where.role = role
  if (status) where.status = status

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { [sort]: order },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ])

  return {
    users: users.map(serializeUser),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  }
}

export async function getUserById(id) {
  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) throw AppError.notFound('User not found')
  return serializeUser(user)
}

export async function createUser(input) {
  const email = input.email.trim().toLowerCase()

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) throw AppError.conflict('A user with that email already exists')

  const created = await prisma.user.create({
    data: {
      id: await nextUserId(),
      name: input.name.trim(),
      email,
      phone: input.phone?.trim() || null,
      passwordHash: await hashPassword(input.password),
      role: input.role,
      status: input.status ?? 'ACTIVE',
      joinedDate: input.joinedDate ? new Date(`${input.joinedDate}T00:00:00.000Z`) : new Date(),
      lastActive: new Date(),
    },
  })

  return serializeUser(created)
}

export async function updateUser(id, input) {
  const existing = await prisma.user.findUnique({ where: { id } })
  if (!existing) throw AppError.notFound('User not found')

  const data = {}

  if (input.name !== undefined) data.name = input.name.trim()
  if (input.phone !== undefined) data.phone = input.phone?.trim() || null
  if (input.joinedDate !== undefined) data.joinedDate = new Date(`${input.joinedDate}T00:00:00.000Z`)
  if (input.role !== undefined) data.role = input.role
  if (input.status !== undefined) data.status = input.status

  if (input.email !== undefined) {
    const email = input.email.trim().toLowerCase()
    if (email !== existing.email) {
      const clash = await prisma.user.findUnique({ where: { email } })
      if (clash) throw AppError.conflict('A user with that email already exists')
    }
    data.email = email
  }

  if (input.password !== undefined) {
    data.passwordHash = await hashPassword(input.password)
  }

  const updated = await prisma.user.update({ where: { id }, data })
  return serializeUser(updated)
}

/**
 * Hard delete. Activity rows reference the user with onDelete: SetNull, so
 * deleting leaves history intact with a null author rather than failing.
 * Guards prevent an administrator from locking everyone out.
 */
export async function deleteUser(id, actorId) {
  const existing = await prisma.user.findUnique({ where: { id } })
  if (!existing) throw AppError.notFound('User not found')

  if (id === actorId) {
    throw AppError.badRequest('You cannot delete your own account')
  }

  if (existing.role === 'ADMINISTRATOR') {
    const remaining = await prisma.user.count({
      where: { role: 'ADMINISTRATOR', status: 'ACTIVE', NOT: { id } },
    })
    if (remaining === 0) {
      throw AppError.badRequest('Cannot delete the last active administrator')
    }
  }

  await prisma.user.delete({ where: { id } })
  return { id }
}