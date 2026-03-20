const express = require('express')
const router  = express.Router()
const {
  getTokens,
  createToken,
  updateTokenStatus,
  deleteToken,
  createEmergencyToken,
  pauseQueue,
  resumeQueue,
} = require('../controllers/token.controller')
const { protect } = require('../middleware/auth.middleware')
const { rbac }    = require('../middleware/rbac.middleware')

router.use(protect)

router.get('/',              rbac(['staff', 'admin', 'doctor']), getTokens)
router.post('/',             rbac(['staff', 'admin']),           createToken)
router.post('/emergency',    rbac(['staff', 'admin']),           createEmergencyToken)
router.patch('/:id/status',  rbac(['staff', 'admin', 'doctor']),updateTokenStatus)
router.delete('/:id',        rbac(['staff', 'admin']),           deleteToken)
router.patch('/queue/pause',  rbac(['staff', 'admin']),          pauseQueue)
router.patch('/queue/resume', rbac(['staff', 'admin']),          resumeQueue)

module.exports = router
