const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const User = sequelize.define('User', {
  id: {
    type:         DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey:   true,
  },
  name: {
    type:      DataTypes.STRING(200),
    allowNull: false,
  },
  email: {
    type:      DataTypes.STRING(200),
    allowNull: false,
    unique:    true,
    validate:  { isEmail: true },
  },
  passwordHash: {
    type:      DataTypes.STRING(255),
    allowNull: false,
  },
  phone: {
    type:      DataTypes.STRING(15),
    allowNull: true,
  },
  role: {
    type:      DataTypes.ENUM('patient', 'admin', 'doctor', 'staff'),
    allowNull: false,
  },
  status: {
    type:         DataTypes.ENUM('pending', 'approved', 'rejected', 'suspended'),
    defaultValue: 'pending',
  },
  clinicId: {
    type:      DataTypes.UUID,
    allowNull: true,
  },
  emailVerified: {
    type:         DataTypes.BOOLEAN,
    defaultValue: false,
  },
  // ── Password reset fields (new) ──────────────────────────────
  resetToken: {
    type:      DataTypes.STRING(255),
    allowNull: true,
  },
  resetTokenExpiry: {
    type:      DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName:  'users',
  timestamps: true,
})

module.exports = User