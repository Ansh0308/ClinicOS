const { User } = require('../models')
const { error } = require('../utils/apiResponse')

// Role-Based Access Control middleware
// Usage: router.get('/admin/stats', protect, rbac(['admin']), controller)
// It fetches the user from DB to get their current role and status
// This way, if an admin suspends a user, they lose access immediately

const rbac = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      const user = await User.findByPk(req.userId, {
        attributes: ['id', 'role', 'status', 'clinicId'],
      })

      if (!user) {
        return error(res, 'User not found.', 404)
      }

      // Suspended users lose all access regardless of role
      if (user.status === 'suspended') {
        return error(res, 'Your account has been suspended. Contact your clinic admin.', 403)
      }

      // Doctor/staff must be approved before accessing dashboards
      if (['doctor', 'staff'].includes(user.role) && user.status === 'pending') {
        return error(res, 'Your account is pending approval from your clinic admin.', 403)
      }

      // Check if their role is in the allowed list
      if (!allowedRoles.includes(user.role)) {
        return error(res, 'You do not have permission to access this resource.', 403)
      }

      // Attach full user object for controllers to use
      req.user = user
      next()
    } catch (err) {
      return error(res, 'Authorization failed.', 500)
    }
  }
}

module.exports = { rbac }
