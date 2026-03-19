const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const JoinRequest = sequelize.define('JoinRequest', {
  id: {
    type:         DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey:   true,
  },
  userId: {
    type:      DataTypes.UUID,
    allowNull: false,
  },
  clinicId: {
    type:      DataTypes.UUID,
    allowNull: false,
  },
  status: {
    type:         DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending',
  },
  reviewedBy: {
    type:      DataTypes.UUID,
    allowNull: true,
  },
  reviewedAt: {
    type:      DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName:  'join_requests',
  timestamps: true,
})

module.exports = JoinRequest