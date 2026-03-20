const User        = require('./user.model')
const Clinic      = require('./clinic.model')
const OtpCode     = require('./otpCode.model')
const JoinRequest = require('./joinRequest.model')
const Patient     = require('./patient.model')
const Token       = require('./token.model')
const Visit       = require('./visit.model')
const Bill        = require('./bill.model')
const MessageLog  = require('./messageLog.model')
const AuditLog    = require('./auditLog.model')

// ── Associations ──────────────────────────────────────────────────────────────
// These tell Sequelize how tables are linked
// They also enable eager loading: Patient.findOne({ include: [Clinic] })

// User ↔ Clinic
User.belongsTo(Clinic, { foreignKey: 'clinicId', as: 'clinic' })
Clinic.hasMany(User,   { foreignKey: 'clinicId', as: 'members' })

// JoinRequest links User to Clinic
JoinRequest.belongsTo(User,   { foreignKey: 'userId',     as: 'user' })
JoinRequest.belongsTo(Clinic, { foreignKey: 'clinicId',   as: 'clinic' })
JoinRequest.belongsTo(User,   { foreignKey: 'reviewedBy', as: 'reviewer' })
Clinic.hasMany(JoinRequest,   { foreignKey: 'clinicId',   as: 'joinRequests' })

// Patient belongs to Clinic
Patient.belongsTo(Clinic, { foreignKey: 'clinicId', as: 'clinic' })
Patient.belongsTo(User,   { foreignKey: 'userId',   as: 'user' })
Clinic.hasMany(Patient,   { foreignKey: 'clinicId', as: 'patients' })

// Token belongs to Patient and Doctor (User)
Token.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' })
Token.belongsTo(User,    { foreignKey: 'doctorId',  as: 'doctor' })
Token.belongsTo(Clinic,  { foreignKey: 'clinicId',  as: 'clinic' })
Patient.hasMany(Token,   { foreignKey: 'patientId', as: 'tokens' })

// Visit belongs to Patient and Doctor
Visit.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' })
Visit.belongsTo(User,    { foreignKey: 'doctorId',  as: 'doctor' })
Visit.belongsTo(Clinic,  { foreignKey: 'clinicId',  as: 'clinic' })
Patient.hasMany(Visit,   { foreignKey: 'patientId', as: 'visits' })

// Bill belongs to Patient and optionally a Visit
Bill.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' })
Bill.belongsTo(Visit,   { foreignKey: 'visitId',   as: 'visit' })
Bill.belongsTo(Clinic,  { foreignKey: 'clinicId',  as: 'clinic' })
Patient.hasMany(Bill,   { foreignKey: 'patientId', as: 'bills' })
Visit.hasMany(Bill,     { foreignKey: 'visitId',   as: 'bills' })

// MessageLog and AuditLog
MessageLog.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' })
AuditLog.belongsTo(User,      { foreignKey: 'userId',    as: 'user' })

// ── Exports ───────────────────────────────────────────────────────────────────
module.exports = {
  User,
  Clinic,
  OtpCode,
  JoinRequest,
  Patient,
  Token,
  Visit,
  Bill,
  MessageLog,
  AuditLog,
}