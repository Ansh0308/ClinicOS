const { error } = require('../utils/apiResponse')

// Global error handler — catches anything thrown in async controllers
// Must be registered LAST in index.js with app.use(errorHandler)
// Has 4 parameters — Express identifies it as error handler by the 4th param (err)

const errorHandler = (err, req, res, next) => {
  console.error('Unhandled error:', err.message)

  // Sequelize validation errors (e.g. unique constraint)
  if (err.name === 'SequelizeUniqueConstraintError') {
    return error(res, 'A record with this information already exists.', 409)
  }

  if (err.name === 'SequelizeValidationError') {
    const messages = err.errors.map(e => e.message).join(', ')
    return error(res, messages, 400)
  }

  // Default
  return error(res, err.message || 'Internal server error', 500)
}

module.exports = { errorHandler }