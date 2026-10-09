const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 }

const REDACTED = '[redacted]'

const SENSITIVE_KEYS = new Set([
  'password',
  'passwordhash',
  'token',
  'accesstoken',
  'refreshtoken',
  'authorization',
  'cookie',
  'secret',
  'jwtsecret',
  'databaseurl',
  'client_secret',
])

function redact(value, depth = 0) {
  if (depth > 4) return REDACTED
  if (Array.isArray(value)) return value.map((item) => redact(item, depth + 1))
  if (value && typeof value === 'object') {
    const output = {}
    for (const [key, nested] of Object.entries(value)) {
      output[key] = SENSITIVE_KEYS.has(key.toLowerCase()) ? REDACTED : redact(nested, depth + 1)
    }
    return output
  }
  return value
}

function write(level, stream, message, meta) {
  const entry = {
    level,
    time: new Date().toISOString(),
    message,
    ...(meta === undefined ? {} : { meta: redact(meta) }),
  }
  stream(`${JSON.stringify(entry)}`)
}

function shouldLog(level) {
  const configured = process.env.LOG_LEVEL
  const threshold = LEVELS[configured] ?? (process.env.NODE_ENV === 'test' ? LEVELS.error : LEVELS.info)
  return LEVELS[level] >= threshold
}

export const logger = {
  debug: (message, meta) => shouldLog('debug') && write('debug', console.debug, message, meta),
  info: (message, meta) => shouldLog('info') && write('info', console.log, message, meta),
  warn: (message, meta) => shouldLog('warn') && write('warn', console.warn, message, meta),
  error: (message, meta) => shouldLog('error') && write('error', console.error, message, meta),
}

export default logger