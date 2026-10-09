export function sendSuccess(res, { data = null, message = 'OK', status = 200 } = {}) {
  return res.status(status).json({ success: true, message, data })
}

export function sendCreated(res, data, message = 'Created') {
  return sendSuccess(res, { data, message, status: 201 })
}

export function sendNoContent(res) {
  return res.status(204).end()
}

export function sendFailure(res, { message = 'Something went wrong', status = 500, details } = {}) {
  const body = { success: false, message }
  if (details !== undefined) body.errors = details
  return res.status(status).json(body)
}