const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const Token = sequelize.define('Token', {
  id: {
    type:         DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey:   true,
  },
  clinicId: {
    type:      DataTypes.UUID,
    allowNull: false,
  },
  doctorId: {
    type:      DataTypes.UUID,
    allowNull: true,
  },
  patientId: {
    type:      DataTypes.UUID,
    allowNull: false,
  },
  tokenNumber: {
    type:      DataTypes.INTEGER,
    allowNull: false,
  },
  status: {
    type:         DataTypes.ENUM('waiting', 'now', 'paused', 'lab', 'served', 'cancelled'),
    defaultValue: 'waiting',
  },
  queuePosition: {
    type:      DataTypes.INTEGER,
    allowNull: true,
  },
  estimatedWait: {
    type:      DataTypes.INTEGER, // in minutes
    allowNull: true,
  },
  issuedAt: {
    type:         DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  calledAt: {
    type:      DataTypes.DATE,
    allowNull: true,
  },
  servedAt: {
    type:      DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName:  'tokens',
  timestamps: true,
})

module.exports = Token