const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const AuditLog = sequelize.define('AuditLog', {
  id: {
    type:         DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey:   true,
  },
  userId: {
    type:      DataTypes.UUID,
    allowNull: true, // null for system-triggered events
  },
  clinicId: {
    type:      DataTypes.UUID,
    allowNull: true,
  },
  action: {
    type:      DataTypes.STRING(100), // e.g. 'USER_APPROVED', 'BILL_PAID'
    allowNull: false,
  },
  entity: {
    type:      DataTypes.STRING(50), // e.g. 'User', 'Bill', 'Token'
    allowNull: false,
  },
  entityId: {
    type:      DataTypes.UUID,
    allowNull: true,
  },
  meta: {
    type:         DataTypes.JSON, // any extra context
    defaultValue: {},
  },
}, {
  tableName:  'audit_logs',
  timestamps: true,
  updatedAt:  false, // audit logs are append-only, never updated
})

module.exports = AuditLog