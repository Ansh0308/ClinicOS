const express = require('express')
const router  = express.Router()
const { lookupPatient, createPatient, getPatient, getPatientProfile, getPatientVisits, updateOptIn, getStaffPatientDetail } = require('../controllers/patient.controller')
const { protect } = require('../middleware/auth.middleware')
const { rbac }    = require('../middleware/rbac.middleware')

router.use(protect, rbac(['staff', 'admin', 'doctor']))

router.post('/lookup', lookupPatient)
router.post('/',       createPatient)
router.get('/:id',     getPatient)
router.get('/:id/profile', getPatientProfile)
router.get('/:id/visits',  getPatientVisits)
router.get('/:id/staff-detail', rbac(['staff', 'admin']), getStaffPatientDetail)
router.patch('/:id/opt-in', rbac(['staff', 'admin']), updateOptIn)

module.exports = router
