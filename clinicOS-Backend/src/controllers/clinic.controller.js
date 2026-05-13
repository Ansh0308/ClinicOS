const { success, error } = require('../utils/apiResponse')
const { User, Clinic, JoinRequest } = require('../models')
const { Op } = require('sequelize')
const { logAudit, ACTIONS } = require('../services/audit.service')

// ── GET /api/admin/stats ──────────────────────────────────────────
const getStats = async (req, res) => {
  try {
    const clinicId = req.user.clinicId

    const [doctors, staff, patients, pendingRequests] = await Promise.all([
      // Total approved doctors
      User.count({ where: { clinicId, role: 'doctor', status: 'approved' } }),
      // Total approved staff
      User.count({ where: { clinicId, role: 'staff', status: 'approved' } }),
      // Total patients registered to this clinic
      require('../models').Patient.count({ where: { clinicId } }),
      // Pending join requests
      JoinRequest.count({ where: { clinicId, status: 'pending' } }),
    ])

    return success(res, { doctors, staff, patients, pendingRequests })
  } catch (err) {
    console.error('getStats error:', err.message)
    return error(res, 'Failed to fetch stats', 500)
  }
}

// ── GET /api/admin/join-requests ──────────────────────────────────
const getJoinRequests = async (req, res) => {
  try {
    const clinicId = req.user.clinicId

    const requests = await JoinRequest.findAll({
      where:   { clinicId },
      include: [{ association: 'user', attributes: ['id', 'name', 'email', 'phone', 'role', 'status', 'createdAt'] }],
      order:   [['createdAt', 'DESC']],
    })

    return success(res, { requests })
  } catch (err) {
    console.error('getJoinRequests error:', err.message)
    return error(res, 'Failed to fetch join requests', 500)
  }
}

// ── PATCH /api/admin/join-requests/:id ────────────────────────────
const reviewRequest = async (req, res) => {
  const { id }     = req.params
  const { action } = req.body // 'approve' or 'reject'

  if (!['approve', 'reject'].includes(action)) {
    return error(res, 'Action must be approve or reject', 400)
  }

  try {
    const clinicId = req.user.clinicId

    const request = await JoinRequest.findOne({
      where: { id, clinicId },
    })

    if (!request) return error(res, 'Request not found', 404)
    if (request.status !== 'pending') {
      return error(res, 'This request has already been reviewed', 400)
    }

    if (action === 'approve') {
      // Update join request
      await request.update({
        status:     'approved',
        reviewedBy: req.user.id,
        reviewedAt: new Date(),
      })
      // Activate the user
      await User.update(
        { status: 'approved', clinicId },
        { where: { id: request.userId } }
      )
    } else {
      await request.update({
        status:     'rejected',
        reviewedBy: req.user.id,
        reviewedAt: new Date(),
      })
      await User.update(
        { status: 'rejected' },
        { where: { id: request.userId } }
      )
    }

    logAudit({
      userId: req.user.id,
      action: action === 'approve' ? ACTIONS.JOIN_REQUEST_APPROVED : ACTIONS.JOIN_REQUEST_REJECTED,
      resourceType: 'user',
      resourceId: request.userId,
      clinicId: req.user.clinicId,
      ip: req.ip
    }).catch(() => {})

    return success(res, { message: `Request ${action}d successfully` })
  } catch (err) {
    console.error('reviewRequest error:', err.message)
    return error(res, 'Failed to review request', 500)
  }
}

// ── GET /api/admin/team ───────────────────────────────────────────
const getTeam = async (req, res) => {
  try {
    const clinicId = req.user.clinicId

    const members = await User.findAll({
      where: {
        clinicId,
        role:   { [Op.in]: ['doctor', 'staff'] },
        status: { [Op.in]: ['approved', 'suspended'] },
      },
      attributes: ['id', 'name', 'email', 'phone', 'role', 'status', 'createdAt'],
      order: [['role', 'ASC'], ['name', 'ASC']],
    })

    return success(res, { members })
  } catch (err) {
    console.error('getTeam error:', err.message)
    return error(res, 'Failed to fetch team', 500)
  }
}

// ── PATCH /api/admin/team/:id ─────────────────────────────────────
const updateMember = async (req, res) => {
  const { id }     = req.params
  const { action } = req.body // 'suspend' or 'reactivate'

  if (!['suspend', 'reactivate'].includes(action)) {
    return error(res, 'Action must be suspend or reactivate', 400)
  }

  try {
    const clinicId = req.user.clinicId

    const member = await User.findOne({
      where: { id, clinicId, role: { [Op.in]: ['doctor', 'staff'] } }
    })

    if (!member) return error(res, 'Team member not found', 404)

    // Prevent admin from suspending themselves
    if (member.id === req.user.id) {
      return error(res, 'You cannot suspend yourself', 400)
    }

    const newStatus = action === 'suspend' ? 'suspended' : 'approved'
    await member.update({ status: newStatus })

    logAudit({
      userId: req.user.id,
      action: action === 'suspend' ? ACTIONS.MEMBER_SUSPENDED : ACTIONS.MEMBER_REACTIVATED,
      resourceType: 'user',
      resourceId: member.id,
      clinicId,
      ip: req.ip
    }).catch(() => {})

    return success(res, { message: `Member ${action}d successfully` })
  } catch (err) {
    console.error('updateMember error:', err.message)
    return error(res, 'Failed to update member', 500)
  }
}

// ── GET /api/admin/clinic ─────────────────────────────────────────
const getClinicDetails = async (req, res) => {
  try {
    const clinic = await Clinic.findByPk(req.user.clinicId)
    if (!clinic) return error(res, 'Clinic not found', 404)
    return success(res, { clinic })
  } catch (err) {
    console.error('getClinicDetails error:', err.message)
    return error(res, 'Failed to fetch clinic', 500)
  }
}

// ── PATCH /api/admin/clinic ───────────────────────────────────────
const updateClinicDetails = async (req, res) => {
  const { name, address, phone, specialty } = req.body

  if (!name) return error(res, 'Clinic name is required', 400)

  try {
    const clinic = await Clinic.findByPk(req.user.clinicId)
    if (!clinic) return error(res, 'Clinic not found', 404)

    await clinic.update({ name, address, phone, specialty })

    logAudit({
      userId: req.user.id,
      action: ACTIONS.CLINIC_UPDATED,
      resourceType: 'clinic',
      resourceId: clinic.id,
      clinicId: req.user.clinicId,
      ip: req.ip
    }).catch(() => {})

    return success(res, { clinic, message: 'Clinic details updated' })
  } catch (err) {
    console.error('updateClinicDetails error:', err.message)
    return error(res, 'Failed to update clinic', 500)
  }
}

// ── GET /api/admin/doctors  (staff + admin accessible)
const getDoctors = async (req, res) => {
  try {
    const doctors = await User.findAll({
      where: {
        clinicId: req.user.clinicId,
        role:     'doctor',
        status:   'approved',
      },
      attributes: ['id', 'name', 'email'],
      order: [['name', 'ASC']],
    })
    return success(res, { doctors })
  } catch (err) {
    console.error('getDoctors error:', err.message)
    return error(res, 'Failed to fetch doctors', 500)
  }
}

// ── GET /api/admin/integrations ───────────────────────────────────────
const getIntegrations = async (req, res) => {
  try {
    const { ClinicSettings } = require('../models')
    const settings = await ClinicSettings.findOne({ where: { clinicId: req.user.clinicId } })
    
    // Mask the keys
    const maskKey = (key) => key ? `${key.substring(0, 4)}...${key.substring(key.length - 4)}` : null
    
    return success(res, { 
      settings: {
        razorpayKeyId: maskKey(settings?.razorpayKeyId),
        razorpayKeySecret: maskKey(settings?.razorpayKeySecret),
        brevoApiKey: maskKey(settings?.brevoApiKey),
      } 
    })
  } catch (err) {
    console.error('getIntegrations error:', err.message)
    return error(res, 'Failed to fetch integrations', 500)
  }
}

// ── PATCH /api/admin/integrations ─────────────────────────────────────
const updateIntegrations = async (req, res) => {
  const { razorpayKeyId, razorpayKeySecret, brevoApiKey } = req.body
  try {
    const { ClinicSettings } = require('../models')
    const clinicId = req.user.clinicId
    
    let settings = await ClinicSettings.findOne({ where: { clinicId } })
    if (!settings) {
      settings = await ClinicSettings.create({ clinicId })
    }
    
    // Only update if provided and not masked
    const updates = {}
    if (razorpayKeyId && !razorpayKeyId.includes('...')) updates.razorpayKeyId = razorpayKeyId
    if (razorpayKeySecret && !razorpayKeySecret.includes('...')) updates.razorpayKeySecret = razorpayKeySecret
    if (brevoApiKey && !brevoApiKey.includes('...')) updates.brevoApiKey = brevoApiKey
    
    if (Object.keys(updates).length > 0) {
      await settings.update(updates)
      
      logAudit({
        userId: req.user.id,
        action: 'INTEGRATIONS_UPDATED',
        resourceType: 'clinicSettings',
        resourceId: settings.id,
        clinicId: req.user.clinicId,
        ip: req.ip
      }).catch(() => {})
    }
    
    return success(res, { message: 'Integrations updated successfully' })
  } catch (err) {
    console.error('updateIntegrations error:', err.message)
    return error(res, 'Failed to update integrations', 500)
  }
}

module.exports = {
  getStats,
  getJoinRequests,
  reviewRequest,
  getTeam,
  updateMember,
  getClinicDetails,
  updateClinicDetails,
  getDoctors,
  getIntegrations,
  updateIntegrations
}