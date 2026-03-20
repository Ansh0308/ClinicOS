const { success, error } = require('../utils/apiResponse')
const { Token, Patient, User, Clinic } = require('../models')
const { Op } = require('sequelize')
const {
  getNextTokenNumber,
  calculateETA,
  recalculatePositions,
} = require('../services/token.service')
const { sendMessage } = require('../services/message.service')

// GET /api/tokens
const getTokens = async (req, res) => {
  try {
    const clinicId = req.user.clinicId
    const today    = new Date()
    today.setHours(0, 0, 0, 0)

    const tokens = await Token.findAll({
      where: {
        clinicId,
        createdAt: { [Op.gte]: today },
      },
      include: [
        { association: 'patient', attributes: ['id', 'name', 'phone'] },
        { association: 'doctor',  attributes: ['id', 'name'] },
      ],
      order: [
        ['status', 'ASC'],      // now → waiting → paused → lab → served → cancelled
        ['queuePosition', 'ASC'],
        ['createdAt', 'ASC'],
      ],
    })

    // Count served today for stats
    const servedToday = await Token.count({
      where: { clinicId, status: 'served', createdAt: { [Op.gte]: today } },
    })

    const inQueue = tokens.filter(t =>
      ['waiting', 'now', 'paused', 'lab'].includes(t.status)
    ).length

    return success(res, { tokens, stats: { inQueue, servedToday } })
  } catch (err) {
    console.error('getTokens error:', err.message)
    return error(res, 'Failed to fetch tokens', 500)
  }
}

// POST /api/tokens
const createToken = async (req, res) => {
  const { patientId, doctorId } = req.body
  const clinicId = req.user.clinicId

  if (!patientId) return error(res, 'Patient ID is required', 400)

  try {
    // Check patient not already in queue
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const existing = await Token.findOne({
      where: {
        patientId,
        clinicId,
        status:    { [Op.in]: ['waiting', 'now', 'paused', 'lab'] },
        createdAt: { [Op.gte]: today },
      },
    })

    if (existing) {
      return error(res, 'Patient already has an active token in the queue', 400)
    }

    const tokenNumber    = await getNextTokenNumber(clinicId)
    const estimatedWait  = await calculateETA(clinicId, doctorId)

    // Count waiting tokens to get position
    const waitingCount = await Token.count({
      where: { clinicId, status: 'waiting', createdAt: { [Op.gte]: today } }
    })

    const token = await Token.create({
      clinicId,
      patientId,
      doctorId:      doctorId || null,
      tokenNumber,
      status:        'waiting',
      queuePosition: waitingCount + 1,
      estimatedWait,
      issuedAt:      new Date(),
    })

    // Fetch with associations for response
    const full = await Token.findByPk(token.id, {
      include: [
        { association: 'patient', attributes: ['id', 'name', 'phone'] },
        { association: 'doctor',  attributes: ['id', 'name'] },
      ],
    })

    // ── Trigger token_issued message ─────────────────────────────────
    try {
      const clinic = await require('../models').Clinic.findByPk(clinicId, {
        attributes: ['name'],
      })

      // Fire and forget — don't await so API responds fast
      sendMessage({
        patientId,
        clinicId,
        templateName: 'token_issued',
        variables: {
          patient_name:    full.patient?.name || 'Patient',
          token_number:    tokenNumber,
          clinic_name:     clinic?.name || 'the clinic',
          queue_position:  waitingCount + 1,
          estimated_wait:  estimatedWait,
        },
        channels: ['email'],
        // Add 'whatsapp' here when WhatsApp API is configured
      })
    } catch (err) {
      // Never let messaging failure break the token creation response
      console.error('Token message trigger failed:', err.message)
    }

    return success(res, { token: full }, 201)
  } catch (err) {
    console.error('createToken error:', err.message)
    return error(res, 'Failed to create token', 500)
  }
}

// PATCH /api/tokens/:id/status
const updateTokenStatus = async (req, res) => {
  const { id }     = req.params
  const { status } = req.body
  const clinicId   = req.user.clinicId

  const validStatuses = ['waiting', 'now', 'paused', 'lab', 'served', 'cancelled']
  if (!validStatuses.includes(status)) {
    return error(res, 'Invalid status', 400)
  }

  try {
    const token = await Token.findOne({ where: { id, clinicId } })
    if (!token) return error(res, 'Token not found', 404)

    const updates = { status }

    if (status === 'now' && !token.calledAt) {
      updates.calledAt = new Date()
    }
    if (status === 'served') {
      updates.servedAt = new Date()
    }

    await token.update(updates)

    // Recalculate positions after any change
    await recalculatePositions(clinicId)

    // ── Trigger your_turn message when called ────────────────────────
    if (status === 'now') {
      try {
        const clinic = await require('../models').Clinic.findByPk(clinicId, {
          attributes: ['name'],
        })
        sendMessage({
          patientId: token.patientId,
          clinicId,
          templateName: 'your_turn',
          variables: {
            patient_name: token.patient?.name || 'Patient',
            token_number: token.tokenNumber,
            clinic_name:  clinic?.name || 'the clinic',
          },
          channels: ['email'],
        })
      } catch (err) {
        console.error('Your turn message trigger failed:', err.message)
      }
    }

    return success(res, { message: 'Token status updated', token })
  } catch (err) {
    console.error('updateTokenStatus error:', err.message)
    return error(res, 'Failed to update token', 500)
  }
}

// DELETE /api/tokens/:id
const deleteToken = async (req, res) => {
  const clinicId = req.user.clinicId

  try {
    const token = await Token.findOne({ where: { id: req.params.id, clinicId } })
    if (!token) return error(res, 'Token not found', 404)

    await token.update({ status: 'cancelled' })
    await recalculatePositions(clinicId)

    return success(res, { message: 'Token cancelled' })
  } catch (err) {
    console.error('deleteToken error:', err.message)
    return error(res, 'Failed to cancel token', 500)
  }
}

// POST /api/tokens/emergency
const createEmergencyToken = async (req, res) => {
  const { patientId, doctorId } = req.body
  const clinicId = req.user.clinicId

  if (!patientId) return error(res, 'Patient ID is required', 400)

  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const tokenNumber = await getNextTokenNumber(clinicId)

    // Shift all waiting tokens down by 1
    await Token.increment('queuePosition', {
      where: { clinicId, status: 'waiting', createdAt: { [Op.gte]: today } }
    })

    const token = await Token.create({
      clinicId,
      patientId,
      doctorId:      doctorId || null,
      tokenNumber,
      status:        'waiting',
      queuePosition: 1, // goes to top
      estimatedWait: 0,
      issuedAt:      new Date(),
    })

    return success(res, { token }, 201)
  } catch (err) {
    console.error('createEmergencyToken error:', err.message)
    return error(res, 'Failed to create emergency token', 500)
  }
}

// PATCH /api/clinic/queue/pause
const pauseQueue = async (req, res) => {
  try {
    await require('../models').Clinic.update(
      { queuePaused: true },
      { where: { id: req.user.clinicId } }
    )
    return success(res, { message: 'Queue paused' })
  } catch (err) {
    return error(res, 'Failed to pause queue', 500)
  }
}

// PATCH /api/clinic/queue/resume
const resumeQueue = async (req, res) => {
  try {
    await require('../models').Clinic.update(
      { queuePaused: false },
      { where: { id: req.user.clinicId } }
    )
    return success(res, { message: 'Queue resumed' })
  } catch (err) {
    return error(res, 'Failed to resume queue', 500)
  }
}

module.exports = {
  getTokens,
  createToken,
  updateTokenStatus,
  deleteToken,
  createEmergencyToken,
  pauseQueue,
  resumeQueue,
}
