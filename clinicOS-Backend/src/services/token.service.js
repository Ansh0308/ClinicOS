const { Token, Patient } = require('../models')
const { Op } = require('sequelize')
const { sendMessage } = require('./message.service')

// Get next token number for today (resets daily per clinic)
const getNextTokenNumber = async (clinicId) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const count = await Token.count({
    where: {
      clinicId,
      createdAt: { [Op.gte]: today },
    },
  })

  return count + 1
}

// Calculate ETA based on average consult time × tokens ahead
const calculateETA = async (clinicId, doctorId) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Count waiting tokens ahead
  const waitingCount = await Token.count({
    where: {
      clinicId,
      doctorId:  doctorId || null,
      status:    'waiting',
      createdAt: { [Op.gte]: today },
    },
  })

  // Count served tokens today to calculate avg consult time
  const servedTokens = await Token.findAll({
    where: {
      clinicId,
      status:    'served',
      servedAt:  { [Op.ne]: null },
      calledAt:  { [Op.ne]: null },
      createdAt: { [Op.gte]: today },
    },
  })

  let avgConsultMins = 10 // default 10 minutes if no data yet

  if (servedTokens.length > 0) {
    const totalMins = servedTokens.reduce((sum, t) => {
      const diff = new Date(t.servedAt) - new Date(t.calledAt)
      return sum + (diff / 1000 / 60)
    }, 0)
    avgConsultMins = Math.ceil(totalMins / servedTokens.length)
  }

  return waitingCount * avgConsultMins
}

// Recalculate queue positions after any status change
const recalculatePositions = async (clinicId) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const waitingTokens = await Token.findAll({
    where: {
      clinicId,
      status:    'waiting',
      createdAt: { [Op.gte]: today },
    },
    include: [{ association: 'patient', attributes: ['id', 'name'] }],
    order: [['createdAt', 'ASC']],
  })

  // Update positions sequentially
  for (let i = 0; i < waitingTokens.length; i++) {
    await waitingTokens[i].update({ queuePosition: i + 1 })
  }

  // Check for position 2 tokens and trigger reminder
  for (const t of waitingTokens) {
    if (t.queuePosition === 2) {
      try {
        const clinic = await require('../models').Clinic.findByPk(t.clinicId, {
          attributes: ['name'],
        })
        sendMessage({
          patientId:    t.patientId,
          clinicId:     t.clinicId,
          templateName: 'two_before_you',
          variables: {
            patient_name: t.patient?.name || 'Patient',
            token_number: t.tokenNumber,
            clinic_name:  clinic?.name || 'the clinic',
          },
          channels: ['email', 'whatsapp'],
        })
      } catch (err) {
        console.error('Two before you trigger failed:', err.message)
      }
    }
  }
}

module.exports = { getNextTokenNumber, calculateETA, recalculatePositions }
