const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const Bill = sequelize.define('Bill', {
  id: {
    type:         DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey:   true,
  },
  visitId: {
    type:      DataTypes.UUID,
    allowNull: true,
  },
  patientId: {
    type:      DataTypes.UUID,
    allowNull: false,
  },
  clinicId: {
    type:      DataTypes.UUID,
    allowNull: false,
  },
  items: {
    type:         DataTypes.JSON, // [{ name, quantity, unitPrice, lineTotal }]
    defaultValue: [],
  },
  subtotal: {
    type:         DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  tax: {
    type:         DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  total: {
    type:         DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  status: {
    type:         DataTypes.ENUM('unpaid', 'paid', 'cancelled'),
    defaultValue: 'unpaid',
  },
  paymentMethod: {
    type:      DataTypes.ENUM('cash', 'upi', 'card'),
    allowNull: true,
  },
  paidAt: {
    type:      DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName:  'bills',
  timestamps: true,
})

module.exports = Bill