// Every API response goes through these helpers
// This ensures a consistent shape: { success, data } or { success, error }
// Frontend can always check response.data.success

const success = (res, data = {}, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data,
  })
}

const error = (res, message = 'Something went wrong', statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    error: message,
  })
}

module.exports = { success, error }