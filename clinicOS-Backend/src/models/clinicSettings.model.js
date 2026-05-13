const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const ClinicSettings = sequelize.define('ClinicSettings', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  clinicId: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
  },
  razorpayKeyId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  razorpayKeySecret: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  brevoApiKey: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  timestamps: true,
  tableName: 'clinic_settings'
})

module.exports = ClinicSettings
