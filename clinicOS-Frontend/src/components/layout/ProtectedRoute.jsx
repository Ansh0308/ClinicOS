import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />
  }

  // Doctor/staff pending approval → hold them on /pending
  if (['doctor', 'staff'].includes(user.role) && user.status === 'pending') {
    return <Navigate to="/pending" replace />
  }

  return children
}