const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const Clinic = sequelize.define('Clinic', {
  id: {
    type:         DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey:   true,
  },
  name: {
    type:      DataTypes.STRING(200),
    allowNull: false,
  },
  address: {
    type:      DataTypes.TEXT,
    allowNull: true,
  },
  phone: {
    type:      DataTypes.STRING(15),
    allowNull: true,
  },
  specialty: {
    type:      DataTypes.STRING(100),
    allowNull: true,
  },
  clinicCode: {
    type:      DataTypes.STRING(10),
    allowNull: false,
    unique:    true,
  },
  adminId: {
    type:      DataTypes.UUID,
    allowNull: true, // set after admin user is created
  },
<<<<<<< HEAD
  queuePaused: {
    type:         DataTypes.BOOLEAN,
    defaultValue: false,
  },
=======
>>>>>>> 37997ae2e6c1a2e778c4d83b697699530c7bad82
}, {
  tableName:  'clinics',
  timestamps: true,
})

module.exports = Clinic