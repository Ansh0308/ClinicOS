const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const Patient = sequelize.define('Patient', {
  id: {
    type:         DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey:   true,
  },
  userId: {
    type:      DataTypes.UUID,
    allowNull: true, // null for walk-in patients who aren't registered users
  },
  clinicId: {
    type:      DataTypes.UUID,
    allowNull: true,
  },
  phone: {
    type:      DataTypes.STRING(15),
    allowNull: false,
  },
  name: {
    type:      DataTypes.STRING(200),
    allowNull: true,
  },
  dob: {
    type:      DataTypes.DATEONLY,
    allowNull: true,
  },
  gender: {
    type:      DataTypes.STRING(10),
    allowNull: true,
  },
  optInMsg: {
    type:         DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName:  'patients',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['phone', 'clinicId'], // same phone can exist in different clinics
    },
  ],
})

module.exports = Patient