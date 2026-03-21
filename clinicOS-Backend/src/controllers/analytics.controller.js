const { Op, fn, col } = require('sequelize')
const { success, error } = require('../utils/apiResponse')
const { Token, Visit, Bill, Patient, User, MessageLog } = require('../models')

const startOfDay = (date) => {
  const value = new Date(date)
  value.setHours(0, 0, 0, 0)
  return value
}

const endOfDay = (date) => {
  const value = new Date(date)
  value.setHours(23, 59, 59, 999)
  return value
}

const formatDateKey = (value) => {
  if (!value) return ''
  if (typeof value === 'string') return value.slice(0, 10)
  return new Date(value).toISOString().slice(0, 10)
}

const getDateRange = (range, customStart, customEnd) => {
  const now = new Date()
  const today = startOfDay(now)

  switch (range) {
    case 'today':
      return { start: today, end: now }
    case '7days': {
      const start = new Date(today)
      start.setDate(start.getDate() - 6)
      return { start, end: now }
    }
    case '30days': {
      const start = new Date(today)
      start.setDate(start.getDate() - 29)
      return { start, end: now }
    }
    case 'custom': {
      const start = customStart ? startOfDay(customStart) : today
      const end = customEnd ? endOfDay(customEnd) : now
      return { start, end }
    }
    default:
      return { start: today, end: now }
  }
}

const toNumber = (value) => Number(value || 0)

const roundPercent = (value, total) => {
  if (!total) return 0
  return Math.round((value / total) * 100)
}

const buildBillQuery = ({ clinicId, start, end, doctorId }) => {
  const query = {
    where: {
      clinicId,
      status: 'paid',
      paidAt: { [Op.between]: [start, end] },
    },
  }

  if (doctorId) {
    query.include = [{
      association: 'visit',
      attributes: [],
      required: true,
      where: { doctorId },
    }]
  }

  return query
}

const sumBills = async (params) => {
  const total = await Bill.sum('total', buildBillQuery(params))
  return toNumber(total)
}

const countBills = async (params) => {
  const count = await Bill.count(buildBillQuery(params))
  return toNumber(count)
}

const safeArray = (value) => {
  if (Array.isArray(value)) return value
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

const getAverageWaitMinutes = async (where) => {
  const servedTokens = await Token.findAll({
    where: {
      ...where,
      status: 'served',
      calledAt: { [Op.ne]: null },
      issuedAt: { [Op.ne]: null },
    },
    attributes: ['issuedAt', 'calledAt'],
    raw: true,
  })

  if (!servedTokens.length) return 0

  const totalWait = servedTokens.reduce((sum, token) => {
    const waitInMinutes = (new Date(token.calledAt) - new Date(token.issuedAt)) / 60000
    return sum + Math.max(waitInMinutes, 0)
  }, 0)

  return Math.round(totalWait / servedTokens.length)
}

const fillDailySeries = (rows, start, end) => {
  const byDate = rows.reduce((acc, row) => {
    const key = formatDateKey(row.date)
    acc[key] = {
      date: key,
      revenue: toNumber(row.revenue),
      count: toNumber(row.count),
    }
    return acc
  }, {})

  const data = []
  const cursor = startOfDay(start)
  const lastDay = startOfDay(end)

  while (cursor <= lastDay) {
    const key = formatDateKey(cursor)
    data.push(byDate[key] || { date: key, revenue: 0, count: 0 })
    cursor.setDate(cursor.getDate() + 1)
  }

  return data
}

const getOverview = async (req, res) => {
  const { range = 'today', doctorId, customStart, customEnd } = req.query
  const clinicId = req.user.clinicId
  const { start, end } = getDateRange(range, customStart, customEnd)
  const periodMs = Math.max(end - start, 1)
  const prevStart = new Date(start.getTime() - periodMs)
  const prevEnd = new Date(start.getTime() - 1)
  const tokenWhere = { clinicId, createdAt: { [Op.between]: [start, end] } }
  const prevTokenWhere = { clinicId, createdAt: { [Op.between]: [prevStart, prevEnd] } }

  if (doctorId) {
    tokenWhere.doctorId = doctorId
    prevTokenWhere.doctorId = doctorId
  }

  const todayRange = getDateRange('today')
  const weekRange = getDateRange('7days')
  const monthRange = getDateRange('30days')

  try {
    const [
      totalTokens,
      servedTokens,
      cancelledTokens,
      totalRevenue,
      paidBills,
      avgWaitMins,
      messageStats,
      totalDoctors,
      activeDoctors,
      prevServedTokens,
      prevRevenue,
      revenueToday,
      revenueWeek,
      revenueMonth,
    ] = await Promise.all([
      Token.count({ where: tokenWhere }),
      Token.count({ where: { ...tokenWhere, status: 'served' } }),
      Token.count({ where: { ...tokenWhere, status: 'cancelled' } }),
      sumBills({ clinicId, start, end, doctorId }),
      countBills({ clinicId, start, end, doctorId }),
      getAverageWaitMinutes(tokenWhere),
      MessageLog.findAll({
        where: {
          clinicId,
          sentAt: { [Op.between]: [start, end] },
        },
        attributes: ['status', [fn('COUNT', col('id')), 'count']],
        group: ['status'],
        raw: true,
      }),
      User.count({
        where: {
          clinicId,
          role: 'doctor',
          status: 'approved',
          ...(doctorId ? { id: doctorId } : {}),
        },
      }),
      Token.count({
        where: {
          clinicId,
          status: 'served',
          doctorId: doctorId || { [Op.ne]: null },
          createdAt: { [Op.between]: [start, end] },
        },
        distinct: true,
        col: 'doctorId',
      }),
      Token.count({ where: { ...prevTokenWhere, status: 'served' } }),
      sumBills({ clinicId, start: prevStart, end: prevEnd, doctorId }),
      sumBills({ clinicId, ...todayRange, doctorId }),
      sumBills({ clinicId, ...weekRange, doctorId }),
      sumBills({ clinicId, ...monthRange, doctorId }),
    ])

    const sentCount = toNumber(messageStats.find((item) => item.status === 'sent')?.count)
    const deliveredCount = toNumber(messageStats.find((item) => item.status === 'delivered')?.count)
    const failedCount = toNumber(messageStats.find((item) => item.status === 'failed')?.count)
    const successfulMessages = sentCount + deliveredCount
    const totalMessages = sentCount + deliveredCount + failedCount
    const tokenThroughputRate = roundPercent(servedTokens, totalTokens)
    const doctorUtilisation = roundPercent(activeDoctors, totalDoctors)
    const noShowRate = roundPercent(cancelledTokens, totalTokens)

    let queueHealth = 'green'
    if (avgWaitMins > 45) queueHealth = 'red'
    else if (avgWaitMins > 25) queueHealth = 'amber'

    const revenueTrend = prevRevenue > 0
      ? Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100)
      : totalRevenue > 0 ? 100 : 0

    const patientTrend = prevServedTokens > 0
      ? Math.round(((servedTokens - prevServedTokens) / prevServedTokens) * 100)
      : servedTokens > 0 ? 100 : 0

    const isAdmin = req.user.role === 'admin'

    return success(res, {
      kpis: {
        patientsToday: servedTokens,
        totalTokens,
        avgWaitMins,
        noShowRate,
        cancelledTokens,
        queueHealth,
        tokenThroughput: servedTokens,
        tokenThroughputRate,
        doctorUtilisation,
        activeDoctors,
        totalDoctors,
        messagesSent: successfulMessages,
        messagesDelivered: deliveredCount,
        messagesFailed: failedCount,
        messageDeliveryRate: roundPercent(successfulMessages, totalMessages),
        revenue: isAdmin ? totalRevenue : null,
        paidBills: isAdmin ? paidBills : null,
      },
      revenueSummary: isAdmin ? {
        today: revenueToday,
        week: revenueWeek,
        month: revenueMonth,
      } : null,
      trends: {
        revenue: isAdmin ? revenueTrend : null,
        patients: patientTrend,
      },
      range,
    })
  } catch (err) {
    console.error('getOverview error:', err.message)
    return error(res, 'Failed to fetch overview', 500)
  }
}

const getRevenue = async (req, res) => {
  const { range = '7days', doctorId, customStart, customEnd } = req.query
  const clinicId = req.user.clinicId
  const { start, end } = getDateRange(range, customStart, customEnd)

  try {
    const query = {
      ...buildBillQuery({ clinicId, start, end, doctorId }),
      attributes: [
        [fn('DATE', col('paidAt')), 'date'],
        [fn('SUM', col('total')), 'revenue'],
        [fn('COUNT', col('Bill.id')), 'count'],
      ],
      group: [fn('DATE', col('paidAt'))],
      order: [[fn('DATE', col('paidAt')), 'ASC']],
      raw: true,
    }

    const rows = await Bill.findAll(query)
    return success(res, { data: fillDailySeries(rows, start, end) })
  } catch (err) {
    console.error('getRevenue error:', err.message)
    return error(res, 'Failed to fetch revenue', 500)
  }
}

const getQueueStats = async (req, res) => {
  const { range = '7days', doctorId, customStart, customEnd } = req.query
  const clinicId = req.user.clinicId
  const { start, end } = getDateRange(range, customStart, customEnd)
  const baseWhere = { clinicId, createdAt: { [Op.between]: [start, end] } }

  if (doctorId) baseWhere.doctorId = doctorId

  try {
    const tokens = await Token.findAll({
      where: baseWhere,
      attributes: ['createdAt', 'issuedAt', 'calledAt', 'status'],
      raw: true,
    })

    const dayMap = {}
    const hourMap = Array.from({ length: 24 }, (_, hour) => ({ hour, count: 0 }))

    tokens.forEach((token) => {
      const createdAt = new Date(token.createdAt)
      hourMap[createdAt.getHours()].count += 1

      if (token.status === 'served' && token.issuedAt && token.calledAt) {
        const dateKey = formatDateKey(createdAt)
        const waitInMinutes = Math.max((new Date(token.calledAt) - new Date(token.issuedAt)) / 60000, 0)

        if (!dayMap[dateKey]) {
          dayMap[dateKey] = { date: dateKey, totalWait: 0, count: 0 }
        }

        dayMap[dateKey].totalWait += waitInMinutes
        dayMap[dateKey].count += 1
      }
    })

    const avgWaitByDay = Object.values(dayMap)
      .map((entry) => ({
        date: entry.date,
        avgWait: Math.round(entry.totalWait / entry.count),
        count: entry.count,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    return success(res, {
      avgWaitByDay,
      throughputByHour: hourMap,
    })
  } catch (err) {
    console.error('getQueueStats error:', err.message)
    return error(res, 'Failed to fetch queue stats', 500)
  }
}

const getTopComplaints = async (req, res) => {
  const { range = '7days', doctorId, customStart, customEnd } = req.query
  const clinicId = req.user.clinicId
  const { start, end } = getDateRange(range, customStart, customEnd)
  const visitWhere = {
    clinicId,
    createdAt: { [Op.between]: [start, end] },
    isComplete: true,
  }

  if (doctorId) visitWhere.doctorId = doctorId

  try {
    const visits = await Visit.findAll({
      where: visitWhere,
      attributes: ['complaintTags', 'complaint'],
      raw: true,
    })

    const tagCount = {}

    visits.forEach((visit) => {
      safeArray(visit.complaintTags).forEach((tag) => {
        if (!tag) return
        tagCount[tag] = (tagCount[tag] || 0) + 1
      })

      if (!visit.complaint) return

      visit.complaint
        .toLowerCase()
        .split(/[\s,.;:/-]+/)
        .filter((word) => word.length > 3)
        .forEach((word) => {
          tagCount[word] = (tagCount[word] || 0) + 0.5
        })
    })

    const topComplaints = Object.entries(tagCount)
      .map(([name, count]) => ({ name, count: Math.round(count) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return success(res, { topComplaints, totalVisits: visits.length })
  } catch (err) {
    console.error('getTopComplaints error:', err.message)
    return error(res, 'Failed to fetch complaints', 500)
  }
}

const getDoctorStats = async (req, res) => {
  const { range = '7days', doctorId, customStart, customEnd } = req.query
  const clinicId = req.user.clinicId
  const { start, end } = getDateRange(range, customStart, customEnd)

  try {
    const doctors = await User.findAll({
      where: {
        clinicId,
        role: 'doctor',
        status: 'approved',
        ...(doctorId ? { id: doctorId } : {}),
      },
      attributes: ['id', 'name'],
      order: [['name', 'ASC']],
      raw: true,
    })

    const doctorStats = await Promise.all(
      doctors.map(async (doctor) => {
        const doctorWhere = {
          clinicId,
          doctorId: doctor.id,
          createdAt: { [Op.between]: [start, end] },
        }

        const [patientsServed, avgWaitMins, revenue] = await Promise.all([
          Token.count({ where: { ...doctorWhere, status: 'served' } }),
          getAverageWaitMinutes(doctorWhere),
          sumBills({ clinicId, start, end, doctorId: doctor.id }),
        ])

        return {
          id: doctor.id,
          name: doctor.name,
          patientsServed,
          avgWaitMins,
          revenue,
        }
      })
    )

    return success(res, { doctors: doctorStats })
  } catch (err) {
    console.error('getDoctorStats error:', err.message)
    return error(res, 'Failed to fetch doctor stats', 500)
  }
}

module.exports = {
  getOverview,
  getRevenue,
  getQueueStats,
  getTopComplaints,
  getDoctorStats,
}
