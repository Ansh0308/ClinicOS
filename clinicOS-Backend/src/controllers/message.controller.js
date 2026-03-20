const { success, error } = require('../utils/apiResponse')
const { MessageLog, Patient } = require('../models')
const { Op } = require('sequelize')

// GET /api/messages
const getMessageLogs = async (req, res) => {
  const { channel, status, limit = 50 } = req.query
  const clinicId = req.user.clinicId

  try {
    const where = { clinicId }
    if (channel) where.channel = channel
    if (status)  where.status  = status

    const logs = await MessageLog.findAll({
      where,
      include: [{
        association: 'patient',
        attributes:  ['id', 'name', 'phone'],
      }],
      order: [['sentAt', 'DESC']],
      limit: parseInt(limit),
    })

    return success(res, { logs })
  } catch (err) {
    console.error('getMessageLogs error:', err.message)
    return error(res, 'Failed to fetch logs', 500)
  }
}

// GET /api/messages/stats
const getMessageStats = async (req, res) => {
  const clinicId = req.user.clinicId
  const today    = new Date()
  today.setHours(0, 0, 0, 0)

  try {
    const [total, sent, failed, todayCount] = await Promise.all([
      MessageLog.count({ where: { clinicId } }),
      MessageLog.count({ where: { clinicId, status: 'sent' } }),
      MessageLog.count({ where: { clinicId, status: 'failed' } }),
      MessageLog.count({ where: { clinicId, sentAt: { [Op.gte]: today } } }),
    ])

    return success(res, { total, sent, failed, today: todayCount })
  } catch (err) {
    return error(res, 'Failed to fetch stats', 500)
  }
}

module.exports = { getMessageLogs, getMessageStats }
