const jwt = require('jsonwebtoken')
require('dotenv').config()

// Signs a JWT with the user's ID as the payload
// The token is what gets stored in the frontend's localStorage
// Every protected request sends this token in the Authorization header

const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  )
}

module.exports = { generateToken }