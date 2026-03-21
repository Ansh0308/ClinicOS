const { success, error } = require('../utils/apiResponse')
const { Patient, Token, Visit, Bill, User, Clinic } = require('../models')
const { Op } = require('sequelize')

// ── Helper: find patient by userId, phone, or email ──────────────
const findPatientForUser = async (userId) => {
  // 1. Try direct userId link first (fastest path)
  let patient = await Patient.findOne({ where: { userId } })
  if (patient) return patient

  // 2. Get user's phone AND email
  const user = await User.findByPk(userId, { attributes: ['phone', 'email'] })
  if (!user) return null

  // 3. Try phone match
  if (user.phone) {
    patient = await Patient.findOne({ where: { phone: user.phone } })
    if (patient) {
      await patient.update({ userId }) // auto-link for future requests
      return patient
    }
  }

  // 4. Try email match
  if (user.email) {
    patient = await Patient.findOne({ where: { email: user.email } })
    if (patient) {
      await patient.update({ userId }) // auto-link for future requests
      return patient
    }
  }

  return null
}

// ── GET /api/patient/dashboard ────────────────────────────────────
const getDashboard = async (req, res) => {
  try {
    const patient = await findPatientForUser(req.userId)

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
    const patient = await findPatientForUser(req.userId)
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

// ── GET /api/patient/profile ──────────────────────────────────────
const getProfile = async (req, res) => {
  try {
    const user    = await User.findByPk(req.userId, {
      attributes: ['id', 'name', 'email', 'phone'],
    })
    const patient = await findPatientForUser(req.userId)

    return success(res, { user, patient })
  } catch (err) {
    console.error('getProfile error:', err.message)
    return error(res, 'Failed to fetch profile', 500)
  }
}

// ── PATCH /api/patient/profile ────────────────────────────────────
const updateProfile = async (req, res) => {
  const { name, dob, gender, optInMsg } = req.body

  try {
    const patient = await findPatientForUser(req.userId)

    if (patient) {
      await patient.update({
        name:     name     ?? patient.name,
        dob:      dob      ?? patient.dob,
        gender:   gender   ?? patient.gender,
        optInMsg: optInMsg !== undefined ? optInMsg : patient.optInMsg,
      })
    }

    if (name) {
      await User.update({ name }, { where: { id: req.userId } })
    }

    return success(res, { message: 'Profile updated' })
  } catch (err) {
    console.error('updateProfile error:', err.message)
    return error(res, 'Failed to update profile', 500)
  }
}

// ── POST /api/patient/leave-queue ─────────────────────────────────
const leaveQueue = async (req, res) => {
  try {
    const patient = await findPatientForUser(req.userId)
    if (!patient) return error(res, 'Patient not found', 404)

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const token = await Token.findOne({
      where: {
        patientId: patient.id,
        status:    { [Op.in]: ['waiting', 'paused'] },
        createdAt: { [Op.gte]: today },
      },
    })

    if (!token) return error(res, 'No active token found', 404)

    await token.update({ status: 'cancelled' })

    const { recalculatePositions } = require('../services/token.service')
    await recalculatePositions(token.clinicId)

    return success(res, { message: 'You have left the queue' })
  } catch (err) {
    console.error('leaveQueue error:', err.message)
    return error(res, 'Failed to leave queue', 500)
  }
}

// ── POST /api/patient/bills/:id/pay ──────────────────────────────
const initiatePayment = async (req, res) => {
  const { paymentMethod } = req.body

  try {
    const patient = await findPatientForUser(req.userId)
    if (!patient) return error(res, 'Patient not found', 404)

    const bill = await Bill.findOne({
      where:   { id: req.params.id, patientId: patient.id },
      include: [{ association: 'clinic', attributes: ['name'] }],
    })

    if (!bill)                  return error(res, 'Bill not found', 404)
    if (bill.status === 'paid') return error(res, 'Bill is already paid', 400)

    const validMethods = ['cash', 'upi', 'card']
    if (!validMethods.includes(paymentMethod)) {
      return error(res, 'Invalid payment method', 400)
    }

    await bill.update({
      status:        'paid',
      paymentMethod,
      paidAt:        new Date(),
    })

    // Trigger receipt email — wrapped so it never breaks the response
    try {
      const { sendMessage } = require('../services/message.service')
      sendMessage({
        patientId:    patient.id,
        clinicId:     bill.clinicId,
        templateName: 'bill_receipt',
        variables: {
          patient_name:   patient.name || 'Patient',
          amount:         Number(bill.total).toLocaleString('en-IN', { minimumFractionDigits: 2 }),
          payment_method: paymentMethod.toUpperCase(),
          payment_date:   new Date().toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' }),
          clinic_name:    bill.clinic?.name || 'the clinic',
        },
        channels: ['email'],
      })
    } catch (msgErr) {
      console.error('Receipt message failed:', msgErr.message)
    }

    return success(res, { message: 'Payment successful', bill })
  } catch (err) {
    console.error('initiatePayment error:', err.message)
    return error(res, 'Payment failed. Please try again.', 500)
  }
}

// ── GET /api/patient/notifications ────────────────────────────────
const getNotifications = async (req, res) => {
  try {
    const patient = await findPatientForUser(req.userId)
    if (!patient) return success(res, { logs: [] })

    const { MessageLog } = require('../models')
    const logs = await MessageLog.findAll({
      where:  { patientId: patient.id },
      order:  [['sentAt', 'DESC']],
      limit:  50,
    })

    return success(res, { logs })
  } catch (err) {
    console.error('getNotifications error:', err.message)
    return error(res, 'Failed to fetch notifications', 500)
  }
}

module.exports = {
  getDashboard,
  getActiveToken,
  getVisitHistory,
  getBillHistory,
  getProfile,
  updateProfile,
  leaveQueue,
  initiatePayment,
  getNotifications,
}
