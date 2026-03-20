const express = require('express')
const router  = express.Router()
const { lookupPatient, createPatient, getPatient, getPatientProfile, getPatientVisits } = require('../controllers/patient.controller')
const { protect } = require('../middleware/auth.middleware')
const { rbac }    = require('../middleware/rbac.middleware')

router.use(protect, rbac(['staff', 'admin', 'doctor']))

router.post('/lookup', lookupPatient)
router.post('/',       createPatient)
router.get('/:id',     getPatient)
router.get('/:id/profile', getPatientProfile)
router.get('/:id/visits',  getPatientVisits)

module.exports = router
