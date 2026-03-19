const jwt = require('jsonwebtoken')
const { error } = require('../utils/apiResponse')
require('dotenv').config()

// This middleware runs before any protected route handler
// It reads the JWT from the Authorization header, verifies it,
// then attaches the decoded userId to req so controllers can use it

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization

  // Check header exists and starts with "Bearer "
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return error(res, 'Not authenticated. Please log in.', 401)
  }

  const token = authHeader.split(' ')[1]

  try {
    // jwt.verify throws if token is expired or tampered with
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Attach userId to request — controllers will use this
    // We intentionally don't fetch the full user here to keep it fast
    // Controllers that need full user data will fetch from DB themselves
    req.userId = decoded.userId

    next()
  } catch (err) {
    return error(res, 'Invalid or expired token. Please log in again.', 401)
  }
}

module.exports = { protect }