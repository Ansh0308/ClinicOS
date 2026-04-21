const { Sequelize } = require('sequelize')
require('dotenv').config()

// Aiven (and most cloud MySQL providers) require SSL.
// Set DB_SSL=true in your production environment variables.
const dialectOptions = process.env.DB_SSL === 'true'
  ? { ssl: { ca: process.env.DB_CA_CERT, rejectUnauthorized: true } }
  : {}

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host:    process.env.DB_HOST,
    port:    process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false,
    dialectOptions,
    pool: {
      max:     10,
      min:     0,
      acquire: 30000,
      idle:    10000,
    },
  }
)

module.exports = sequelize