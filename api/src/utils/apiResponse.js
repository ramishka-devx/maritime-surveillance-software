export function success(res, data = null, message = 'Success', status = 200) {
  return res.status(status).json({ success: true, message, data });
}

export function fail(res, message = 'Failed', status = 400, details) {
  return res.status(status).json({ success: false, message, details });
}
