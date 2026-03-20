const { success, error } = require('../utils/apiResponse')
const { Patient, Token, Visit, Bill, User, Clinic } = require('../models')
const { Op } = require('sequelize')

// ── Helper: find patient by userId OR phone ───────────────────────
const findPatientForUser = async (userId) => {
  // Try direct link first
  let patient = await Patient.findOne({ where: { userId } })
  if (patient) return patient

  // Fall back to phone match
  const user = await User.findByPk(userId, { attributes: ['phone'] })
  if (!user?.phone) return null

  patient = await Patient.findOne({ where: { phone: user.phone } })

  // Auto-link for future lookups
  if (patient) {
    await patient.update({ userId })
  }

  return patient
}

// ── GET /api/patient/dashboard ────────────────────────────────────
const getDashboard = async (req, res) => {
  try {
    console.log('getDashboard -> req.userId:', req.userId)
    const patient = await findPatientForUser(req.userId)
    console.log('getDashboard -> found patient:', patient?.id, patient?.phone)

    if (!patient) {
      return success(res, {
        patient:      null,
        activeToken:  null,
        recentVisits: [],
        recentBills:  [],
        message: 'No patient profile found. Visit a clinic to get registered.',
      })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [activeToken, recentVisits, recentBills] = await Promise.all([
      Token.findOne({
        where: {
          patientId: patient.id,
          status:    { [Op.in]: ['waiting', 'now', 'paused', 'lab'] },
          createdAt: { [Op.gte]: today },
        },
        include: [
          { association: 'doctor', attributes: ['id', 'name'] },
          { association: 'clinic', attributes: ['id', 'name'] },
        ],
      }),

      Visit.findAll({
        where:   { patientId: patient.id, isComplete: true },
        include: [{ association: 'doctor', attributes: ['id', 'name'] }],
        order:   [['createdAt', 'DESC']],
        limit:   3,
      }),

      Bill.findAll({
        where:   { patientId: patient.id },
        include: [{ association: 'clinic', attributes: ['id', 'name'] }],
        order:   [['createdAt', 'DESC']],
        limit:   3,
      }),
    ])

    return success(res, { patient, activeToken, recentVisits, recentBills })
  } catch (err) {
    console.error('getDashboard error:', err.message)
    return error(res, 'Failed to fetch dashboard', 500)
  }
}

// ── GET /api/patient/token ────────────────────────────────────────
const getActiveToken = async (req, res) => {
  try {
    console.log('getActiveToken -> req.userId:', req.userId)
    const patient = await findPatientForUser(req.userId)
    console.log('getActiveToken -> found patient:', patient?.id, patient?.phone)

    if (!patient) return success(res, { token: null })

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const token = await Token.findOne({
      where: {
        patientId: patient.id,
        status:    { [Op.in]: ['waiting', 'now', 'paused', 'lab'] },
        createdAt: { [Op.gte]: today },
      },
      include: [
        { association: 'doctor', attributes: ['id', 'name'] },
        { association: 'clinic', attributes: ['id', 'name'] },
      ],
    })

    if (!token) return success(res, { token: null })

    // Count tokens ahead for live position
    const tokensAhead = await Token.count({
      where: {
        clinicId:      token.clinicId,
        status:        'waiting',
        queuePosition: { [Op.lt]: token.queuePosition || 999 },
        createdAt:     { [Op.gte]: today },
      },
    })

    return success(res, {
      token: {
        ...token.toJSON(),
        tokensAhead,
        livePosition: tokensAhead + (token.status === 'waiting' ? 1 : 0),
      }
    })
  } catch (err) {
    console.error('getActiveToken error:', err.message)
    return error(res, 'Failed to fetch token', 500)
  }
}

// ── GET /api/patient/visits ───────────────────────────────────────
const getVisitHistory = async (req, res) => {
  try {
    const patient = await findPatientForUser(req.userId)
    if (!patient) return success(res, { visits: [], patient: null })

    const visits = await Visit.findAll({
      where:   { patientId: patient.id, isComplete: true },
      include: [
        { association: 'doctor', attributes: ['id', 'name'] },
        { association: 'clinic', attributes: ['id', 'name'] },
      ],
      order: [['createdAt', 'DESC']],
    })

    return success(res, { patient, visits })
  } catch (err) {
    console.error('getVisitHistory error:', err.message)
    return error(res, 'Failed to fetch visits', 500)
  }
}

// ── GET /api/patient/bills ────────────────────────────────────────
const getBillHistory = async (req, res) => {
  try {
    const patient = await findPatientForUser(req.userId)
    if (!patient) return success(res, { bills: [] })

    const bills = await Bill.findAll({
      where:   { patientId: patient.id },
      include: [{ association: 'clinic', attributes: ['id', 'name'] }],
      order:   [['createdAt', 'DESC']],
    })

    return success(res, { bills })
  } catch (err) {
    console.error('getBillHistory error:', err.message)
    return error(res, 'Failed to fetch bills', 500)
  }
}

module.exports = { getDashboard, getActiveToken, getVisitHistory, getBillHistory }
