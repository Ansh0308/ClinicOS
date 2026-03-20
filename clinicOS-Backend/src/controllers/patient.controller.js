const { success, error } = require('../utils/apiResponse')
const { Patient, Token, User } = require('../models')
const { Op } = require('sequelize')

// ── Helper: build patient response object ─────────────────────────────────────
const buildPatientResponse = async (patient, clinicId) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const activeToken = await Token.findOne({
    where: {
      patientId: patient.id,
      clinicId,
      status:    { [Op.in]: ['waiting', 'now', 'paused', 'lab'] },
      createdAt: { [Op.gte]: today },
    },
  })

  const visitCount = await require('../models').Visit.count({
    where: { patientId: patient.id }
  })

  return {
    id:          patient.id,
    name:        patient.name,
    phone:       patient.phone,
    dob:         patient.dob,
    gender:      patient.gender,
    visitCount,
    hasActiveToken: !!activeToken,
    activeTokenId:  activeToken?.id || null,
    tokenNumber:    activeToken?.tokenNumber || null,
  }
}

// POST /api/patients/lookup
const lookupPatient = async (req, res) => {
  let { phone } = req.body
  const clinicId  = req.user.clinicId

  if (!phone) return error(res, 'Phone number is required', 400)
  phone = phone.toString().replace(/\D/g, '').slice(0, 10)

  try {
    // ── Stage 1: check patients table (walk-in / reception-registered) ───────
    let patient = await Patient.findOne({
      where: { phone, clinicId },
    })

    // ── Stage 2: fall back to users table (registered via homepage signup) ───
    if (!patient) {
      const userRecord = await User.findOne({
        where: { phone, role: 'patient' },
      })

      if (userRecord) {
        // Transparently create a clinic-linked patient record for this user
        patient = await Patient.create({
          clinicId,
          userId:   userRecord.id,
          phone:    userRecord.phone,
          name:     userRecord.name  || null,
          gender:   null,
          optInMsg: true,
        })
      }
    }

    if (!patient) {
      return success(res, { found: false })
    }

    return success(res, {
      found: true,
      patient: await buildPatientResponse(patient, clinicId),
    })
  } catch (err) {
    console.error('lookupPatient error:', err.message)
    return error(res, 'Lookup failed', 500)
  }
}

// POST /api/patients
const createPatient = async (req, res) => {
  let { phone, name, dob, gender, optInMsg } = req.body
  const clinicId = req.user.clinicId

  if (!phone) return error(res, 'Phone number is required', 400)
  phone = phone.toString().replace(/\D/g, '').slice(0, 10)

  try {
    // Check not already registered in this clinic
    const existing = await Patient.findOne({ where: { phone, clinicId } })
    if (existing) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const activeToken = await Token.findOne({
        where: {
          patientId: existing.id,
          clinicId,
          status:    { [Op.in]: ['waiting', 'now', 'paused', 'lab'] },
          createdAt: { [Op.gte]: today },
        }
      })
      if (activeToken) {
        return error(res, 'Patient already has active token', 409)
      }
      // Patient exists but no active token — return them instead of erroring
      return success(res, {
        patient: { ...existing.toJSON(), visitCount: 0, hasActiveToken: false }
      }, 200)
    }

    // Also check if they pre-registered via homepage (users table)
    // and create a linked record
    const userRecord = await User.findOne({ where: { phone, role: 'patient' } })

    const patient = await Patient.create({
      clinicId,
      userId:   userRecord?.id  || null,
      phone,
      name:     name            || userRecord?.name || null,
      dob:      dob             || null,
      gender:   gender          || null,
      optInMsg: optInMsg !== false,
    })

    return success(res, { patient }, 201)
  } catch (err) {
    console.error('createPatient error:', err.message)
    return error(res, 'Failed to create patient', 500)
  }
}

// GET /api/patients/:id
const getPatient = async (req, res) => {
  try {
    const patient = await Patient.findOne({
      where: { id: req.params.id, clinicId: req.user.clinicId },
    })

    if (!patient) return error(res, 'Patient not found', 404)

    return success(res, { patient })
  } catch (err) {
    console.error('getPatient error:', err.message)
    return error(res, 'Failed to fetch patient', 500)
  }
}

module.exports = { lookupPatient, createPatient, getPatient }
