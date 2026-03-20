const express = require('express')
const router  = express.Router()
const { createBill, markPaid, getBill, getPatientBills } = require('../controllers/bill.controller')
const { protect } = require('../middleware/auth.middleware')
const { rbac }    = require('../middleware/rbac.middleware')

router.use(protect)

router.post('/',              rbac(['staff', 'admin']),          createBill)
router.get('/',               rbac(['staff', 'admin', 'doctor']),getPatientBills)
router.get('/:id',            rbac(['staff', 'admin', 'doctor']),getBill)
router.patch('/:id/payment',  rbac(['staff', 'admin']),          markPaid)

module.exports = router
