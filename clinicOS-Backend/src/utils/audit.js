const { AuditLog } = require('../models')

/**
 * Write an audit trail entry. Never throws — failure is logged only.
 */
const writeAudit = async ({ userId, clinicId, action, entity, entityId, meta = {} }) => {
  try {
    await AuditLog.create({ userId, clinicId, action, entity, entityId, meta })
  } catch (err) {
    // Never let audit failure break the main flow
    console.error('Audit log failed:', err.message)
  }
}

module.exports = { writeAudit }
