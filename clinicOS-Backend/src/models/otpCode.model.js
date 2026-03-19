const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const OtpCode = sequelize.define('OtpCode', {
  id: {
    type:         DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey:   true,
  },
  email: {
    type:      DataTypes.STRING(200),
    allowNull: false,
  },
  code: {
    type:      DataTypes.STRING(6),
    allowNull: false,
  },
  expiresAt: {
    type:      DataTypes.DATE,
    allowNull: false,
  },
  used: {
    type:         DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName:  'otp_codes',
  timestamps: true,
})

module.exports = OtpCode