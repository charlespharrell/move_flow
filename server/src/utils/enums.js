/**
 * The API speaks the product's display vocabulary ("Administrator", "In
 * Transit") while Prisma stores SCREAMING_SNAKE enum members
 * ("ADMINISTRATOR", "IN_TRANSIT"). These helpers translate between the two so
 * the frontend keeps consuming the shapes it already uses.
 */

const RAW_ENUM = /^[A-Z][A-Z0-9_]*$/
const SEPARATORS = /[\s_-]+/

export function humanizeEnum(value) {
  if (typeof value !== 'string' || RAW_ENUM.test(value) === false) return value
  return value
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function toEnumValue(value) {
  if (typeof value !== 'string') return value
  return value.trim().split(SEPARATORS).filter(Boolean).join('_').toUpperCase()
}

/** Display label -> enum member, validated against the given Prisma enum. */
export function resolveEnumValue(label, enumObject) {
  const candidate = toEnumValue(label)
  const allowed = Object.values(enumObject)
  return allowed.includes(candidate) ? candidate : null
}

/** Format a Date / Date-only column as 'YYYY-MM-DD' for the UI. */
export function toDateOnly(value) {
  if (!value) return null
  if (typeof value === 'string') return value.slice(0, 10)
  return value.toISOString().slice(0, 10)
}