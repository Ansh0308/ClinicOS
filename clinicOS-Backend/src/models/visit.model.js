const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const Visit = sequelize.define('Visit', {
  id: {
    type:         DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey:   true,
  },
  patientId: { type: DataTypes.UUID, allowNull: false },
  doctorId:  { type: DataTypes.UUID, allowNull: false },
  clinicId:  { type: DataTypes.UUID, allowNull: false },
  tokenId:   { type: DataTypes.UUID, allowNull: true },
  complaint: { type: DataTypes.TEXT, allowNull: true },
  complaintTags: { type: DataTypes.JSON, defaultValue: [] },
  vitals: {
    type:         DataTypes.JSON,
    defaultValue: {},
    // stores: { bp: '120/80', temp: '98.6', weight: '70', height: '170' }
  },
  diagnosis:     { type: DataTypes.TEXT, allowNull: true },
  notes:         { type: DataTypes.TEXT, allowNull: true },
  prescriptions: { type: DataTypes.JSON, defaultValue: [] },
  testsOrdered:  { type: DataTypes.JSON, defaultValue: [] },
  followUpDate:  { type: DataTypes.DATEONLY, allowNull: true },
  isComplete:    { type: DataTypes.BOOLEAN, defaultValue: false },
}, {
  tableName:  'visits',
  timestamps: true,
})

module.exports = Visit