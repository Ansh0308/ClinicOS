const express = require('express')
const router  = express.Router()
const { getMessageLogs, getMessageStats } = require('../controllers/message.controller')
const { protect } = require('../middleware/auth.middleware')
const { rbac }    = require('../middleware/rbac.middleware')

router.use(protect, rbac(['admin', 'staff']))

router.get('/',       getMessageLogs)
router.get('/stats',  getMessageStats)

module.exports = router
