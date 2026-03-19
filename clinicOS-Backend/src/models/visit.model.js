const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const Visit = sequelize.define('Visit', {
  id: {
    type:         DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey:   true,
  },
  patientId: {
    type:      DataTypes.UUID,
    allowNull: false,
  },
  doctorId: {
    type:      DataTypes.UUID,
    allowNull: false,
  },
  clinicId: {
    type:      DataTypes.UUID,
    allowNull: false,
  },
  complaint: {
    type:      DataTypes.TEXT,
    allowNull: true,
  },
  complaintTags: {
    type:         DataTypes.JSON,
    defaultValue: [],
  },
  diagnosis: {
    type:      DataTypes.TEXT,
    allowNull: true,
  },
  notes: {
    type:      DataTypes.TEXT, // private doctor notes
    allowNull: true,
  },
  prescriptions: {
    type:         DataTypes.JSON, // array of { name, dose, frequency, duration, instructions }
    defaultValue: [],
  },
  testsOrdered: {
    type:         DataTypes.JSON,
    defaultValue: [],
  },
  followUpDate: {
    type:      DataTypes.DATEONLY,
    allowNull: true,
  },
  isComplete: {
    type:         DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName:  'visits',
  timestamps: true,
})

module.exports = Visit