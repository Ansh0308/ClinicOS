const bcrypt = require('bcryptjs')
const { User, Clinic, JoinRequest } = require('../models')
const { generateToken } = require('../utils/generateToken')
const { generateClinicCode } = require('../utils/generateCode')

const registerUser = async ({ name, email, password, phone, role, clinicData, clinicCode, qualification, designation }) => {

  // Check email not already taken
  const existing = await User.findOne({ where: { email } })
  if (existing) {
    throw new Error('An account with this email already exists')
  }

  const passwordHash = await bcrypt.hash(password, 12)

  // Admin and patient are auto-approved
  // Doctor and staff start as pending until clinic admin approves
  const status = ['admin', 'patient'].includes(role) ? 'approved' : 'pending'

  const user = await User.create({
    name,
    email,
    passwordHash,
    phone:         phone || null,
    role,
    status,
    emailVerified: true, // OTP was already verified before calling register
  })

  let clinicId   = null
  let clinicName = null
  let clinicCodeOut = null

  // ── Admin: create their clinic ──────────────────────────────────
  if (role === 'admin' && clinicData) {
    // Generate a unique clinic code
    let code
    let unique = false
    while (!unique) {
      code = generateClinicCode()
      const exists = await Clinic.findOne({ where: { clinicCode: code } })
      unique = !exists
    }

    const clinic = await Clinic.create({
      name:       clinicData.name,
      address:    clinicData.address || null,
      phone:      clinicData.phone   || null,
      specialty:  clinicData.specialty || null,
      clinicCode: code,
      adminId:    user.id,
    })

    // Link admin to their clinic
    await user.update({ clinicId: clinic.id })

    clinicId      = clinic.id
    clinicName    = clinic.name
    clinicCodeOut = code
  }

  // ── Doctor / Staff: submit join request ─────────────────────────
  if (['doctor', 'staff'].includes(role) && clinicCode) {
    const clinic = await Clinic.findOne({ where: { clinicCode } })

    if (!clinic) {
      // Still create the account but warn about the code
      throw new Error('Clinic code not found. Please check the code and try again.')
    }

    await JoinRequest.create({
      userId:   user.id,
      clinicId: clinic.id,
    })

    // Link user to clinic (still pending)
    await user.update({ clinicId: clinic.id })

    clinicId   = clinic.id
    clinicName = clinic.name
  }

  const token = generateToken(user.id)

  return {
    token,
    user: {
      id:         user.id,
      name:       user.name,
      email:      user.email,
      role:       user.role,
      status:     user.status,
      clinicId,
      clinicName,
      clinicCode: clinicCodeOut, // only for admin
    },
  }
}

const loginUser = async (email, password) => {
  // Find user with their clinic info
  const user = await User.findOne({
    where: { email },
    include: [{ association: 'clinic', attributes: ['id', 'name', 'clinicCode'] }],
  })

  if (!user) {
    throw new Error('Invalid email or password')
  }

  const match = await bcrypt.compare(password, user.passwordHash)
  if (!match) {
    throw new Error('Invalid email or password')
  }

  const token = generateToken(user.id)

  return {
    token,
    user: {
      id:         user.id,
      name:       user.name,
      email:      user.email,
      role:       user.role,
      status:     user.status,
      clinicId:   user.clinicId,
      clinicName: user.clinic?.name       || null,
      clinicCode: user.clinic?.clinicCode || null,
    },
  }
}

module.exports = { registerUser, loginUser }