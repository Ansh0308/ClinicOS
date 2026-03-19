const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const MessageLog = sequelize.define('MessageLog', {
  id: {
    type:         DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey:   true,
  },
  patientId: {
    type:      DataTypes.UUID,
    allowNull: false,
  },
  clinicId: {
    type:      DataTypes.UUID,
    allowNull: false,
  },
  channel: {
    type:      DataTypes.ENUM('whatsapp', 'sms', 'email'),
    allowNull: false,
  },
  template: {
    type:      DataTypes.STRING(100),
    allowNull: false,
  },
  status: {
    type:         DataTypes.ENUM('sent', 'failed', 'delivered'),
    defaultValue: 'sent',
  },
  sentAt: {
    type:         DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName:  'message_logs',
  timestamps: true,
})

module.exports = MessageLog