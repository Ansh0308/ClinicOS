const { success, error } = require('../utils/apiResponse')
const { AuditLog, User } = require('../models')
const { Op } = require('sequelize')

// GET /api/admin/audit-logs
const getAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 20, userId, action, startDate, endDate } = req.query
    const clinicId = req.user.clinicId

    const offset = (page - 1) * limit
    const where = { clinicId }

    if (userId) where.userId = userId
    if (action) where.action = action
    
    if (startDate && endDate) {
      // endDate should include the whole day if it's just a date string like YYYY-MM-DD
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      where.createdAt = {
        [Op.between]: [new Date(startDate), end]
      }
    } else if (startDate) {
      where.createdAt = { [Op.gte]: new Date(startDate) }
    } else if (endDate) {
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      where.createdAt = { [Op.lte]: end }
    }

    const { count, rows } = await AuditLog.findAndCountAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'role'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    })

    return success(res, {
      logs: rows,
      total: count,
      page: parseInt(page, 10),
      totalPages: Math.ceil(count / limit)
    })
  } catch (err) {
    console.error('getAuditLogs error:', err.message)
    return error(res, 'Failed to fetch audit logs', 500)
  }
}

module.exports = {
  getAuditLogs
}
