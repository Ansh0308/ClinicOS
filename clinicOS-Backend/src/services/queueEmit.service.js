const { emitToClinic, emitToPatient } = require('./socket.service')

const emitQueueUpdate = async (clinicId) => {
  const { Token } = require('../models')
  const { Op }    = require('sequelize')

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  try {
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
        ['status', 'ASC'],
        ['queuePosition', 'ASC'],
        ['createdAt', 'ASC'],
      ],
    })

    const servedToday = tokens.filter(t => t.status === 'served').length
    const inQueue     = tokens.filter(t =>
      ['waiting','now','paused','lab'].includes(t.status)
    ).length

    emitToClinic(clinicId, 'queue:updated', {
      tokens,
      stats: { inQueue, servedToday },
    })

    const waitingTokens = tokens.filter(t =>
      ['waiting','now','paused','lab'].includes(t.status) && t.patientId
    )

    for (const token of waitingTokens) {
      const tokensAhead = tokens.filter(t =>
        t.status === 'waiting' &&
        (t.queuePosition || 0) < (token.queuePosition || 0)
      ).length

      emitToPatient(token.patientId, 'token:position', {
        tokenId:       token.id,
        tokenNumber:   token.tokenNumber,
        status:        token.status,
        queuePosition: token.queuePosition,
        estimatedWait: token.estimatedWait,
        tokensAhead,
        livePosition:  tokensAhead + (token.status === 'waiting' ? 1 : 0),
      })
    }

    const servedTokens = tokens.filter(t => t.status === 'served' && t.patientId)
    for (const token of servedTokens) {
      emitToPatient(token.patientId, 'token:served', {
        tokenId:     token.id,
        tokenNumber: token.tokenNumber,
      })
    }
  } catch (err) {
    console.error('emitQueueUpdate error:', err.message)
  }
}

const emitBillUpdate = async (patientId, clinicId) => {
  const { Bill } = require('../models')

  try {
    const bills = await Bill.findAll({
      where:   { patientId, clinicId },
      include: [{ association: 'clinic', attributes: ['id', 'name'] }],
      order:   [['createdAt', 'DESC']],
    })

    emitToPatient(patientId, 'bills:updated', { bills })

    emitToClinic(clinicId, 'bill:updated', {
      patientId,
      message: 'Bill status changed',
    })
  } catch (err) {
    console.error('emitBillUpdate error:', err.message)
  }
}

const emitNewToken = async (token) => {
  try {
    const { Clinic } = require('../models')
    const clinic = await Clinic.findByPk(token.clinicId, { attributes: ['id', 'name'] })
    emitToPatient(token.patientId, 'token:new', {
      tokenId:       token.id,
      tokenNumber:   token.tokenNumber,
      status:        token.status,
      queuePosition: token.queuePosition,
      estimatedWait: token.estimatedWait,
      clinic:        clinic ? { id: clinic.id, name: clinic.name } : null,
      doctor:        token.doctor || null,
    })
  } catch (err) {
    console.error('emitNewToken error:', err.message)
  }
}

module.exports = { emitQueueUpdate, emitBillUpdate, emitNewToken }
