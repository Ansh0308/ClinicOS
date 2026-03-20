const { success, error } = require('../utils/apiResponse')
const { Visit, Patient, User, Token } = require('../models')
const { Op } = require('sequelize')

// POST /api/visits
const createVisit = async (req, res) => {
  const { patientId, tokenId } = req.body
  const doctorId  = req.user.id
  const clinicId  = req.user.clinicId

  if (!patientId) return error(res, 'Patient ID is required', 400)

  try {
    // Check no active visit already exists for this token
    if (tokenId) {
      const existing = await Visit.findOne({ where: { tokenId } })
      if (existing) {
        return success(res, { visit: existing })
      }
    }

    const visit = await Visit.create({
      patientId,
      doctorId,
      clinicId,
      tokenId: tokenId || null,
    })

    return success(res, { visit }, 201)
  } catch (err) {
    console.error('createVisit error:', err.message)
    return error(res, 'Failed to create visit', 500)
  }
}

// PATCH /api/visits/:id  (autosave)
const updateVisit = async (req, res) => {
  const { id } = req.params
  const {
    complaint, complaintTags, vitals,
    diagnosis, notes, prescriptions,
    testsOrdered, followUpDate,
  } = req.body

  try {
    const visit = await Visit.findOne({
      where: { id, doctorId: req.user.id },
    })

    if (!visit) return error(res, 'Visit not found', 404)
    if (visit.isComplete) return error(res, 'Visit is already completed', 400)

    await visit.update({
      complaint:     complaint     ?? visit.complaint,
      complaintTags: complaintTags ?? visit.complaintTags,
      vitals:        vitals        ?? visit.vitals,
      diagnosis:     diagnosis     ?? visit.diagnosis,
      notes:         notes         ?? visit.notes,
      prescriptions: prescriptions ?? visit.prescriptions,
      testsOrdered:  testsOrdered  ?? visit.testsOrdered,
      followUpDate:  followUpDate  ?? visit.followUpDate,
    })

    return success(res, { visit, savedAt: new Date().toISOString() })
  } catch (err) {
    console.error('updateVisit error:', err.message)
    return error(res, 'Autosave failed', 500)
  }
}

// PATCH /api/visits/:id/complete
const completeVisit = async (req, res) => {
  const { id } = req.params

  try {
    const visit = await Visit.findOne({
      where: { id, doctorId: req.user.id },
    })

    if (!visit) return error(res, 'Visit not found', 404)
    if (visit.isComplete) return error(res, 'Already completed', 400)

    await visit.update({ isComplete: true })

    // Mark the linked token as served
    if (visit.tokenId) {
      await Token.update(
        { status: 'served', servedAt: new Date() },
        { where: { id: visit.tokenId } }
      )
    }

    return success(res, { message: 'Visit completed' })
  } catch (err) {
    console.error('completeVisit error:', err.message)
    return error(res, 'Failed to complete visit', 500)
  }
}

// GET /api/visits/patients/:id/visits  (also used from patient routes)
const getPatientVisits = async (req, res) => {
  try {
    const patient = await Patient.findOne({
      where: { id: req.params.id, clinicId: req.user.clinicId },
    })

    if (!patient) return error(res, 'Patient not found', 404)

    const visits = await Visit.findAll({
      where:  { patientId: req.params.id },
      include: [{ association: 'doctor', attributes: ['id', 'name'] }],
      order:  [['createdAt', 'DESC']],
    })

    return success(res, { patient, visits })
  } catch (err) {
    console.error('getPatientVisits error:', err.message)
    return error(res, 'Failed to fetch visits', 500)
  }
}

// GET /api/visits/patients/:id/profile  (also used from patient routes)
const getPatientProfile = async (req, res) => {
  try {
    const patient = await Patient.findOne({
      where: { id: req.params.id, clinicId: req.user.clinicId },
    })

    if (!patient) return error(res, 'Patient not found', 404)

    const [visits, lastVisit] = await Promise.all([
      Visit.count({ where: { patientId: patient.id } }),
      Visit.findOne({
        where:  { patientId: patient.id },
        order:  [['createdAt', 'DESC']],
        attributes: ['createdAt', 'complaint', 'diagnosis'],
      }),
    ])

    return success(res, {
      patient: {
        ...patient.toJSON(),
        visitCount: visits,
        lastVisit:  lastVisit?.createdAt || null,
        lastComplaint: lastVisit?.complaint || null,
      }
    })
  } catch (err) {
    console.error('getPatientProfile error:', err.message)
    return error(res, 'Failed to fetch profile', 500)
  }
}

module.exports = { createVisit, updateVisit, completeVisit, getPatientVisits, getPatientProfile }
