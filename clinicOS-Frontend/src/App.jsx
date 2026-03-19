import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import ProtectedRoute from './components/layout/ProtectedRoute'

// Pages
import HomePage         from './pages/HomePage'
import LoginPage        from './pages/auth/LoginPage'
import RoleSelector     from './pages/auth/RoleSelector'
import PatientSignup    from './pages/auth/PatientSignup'
import AdminSignup      from './pages/auth/AdminSignup'
import DoctorSignup     from './pages/auth/DoctorSignup'
import StaffSignup      from './pages/auth/StaffSignup'
import PendingApproval  from './pages/auth/PendingApproval'
import UnauthorizedPage from './pages/auth/UnauthorizedPage'

const ComingSoon = ({ name }) => (
  <div className="min-h-screen hero-glow flex items-center justify-center">
    <div className="card text-center p-12">
      <p className="font-display text-3xl text-crimson-500 mb-2">{name}</p>
      <p className="font-body text-text-muted">Coming in next phase</p>
    </div>
  </div>
)

function getDashboardRoute(role) {
  const routes = { staff:'/reception', doctor:'/doctor', admin:'/admin', patient:'/patient' }
  return routes[role] || '/'
}

function App() {
  const { user } = useAuth()

  return (
    <BrowserRouter>
      {!user && <Navbar />}

      <Routes>
        {/* Public */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login"          element={user ? <Navigate to={getDashboardRoute(user.role)} replace /> : <LoginPage />} />
        <Route path="/signup"         element={<RoleSelector />} />
        <Route path="/signup/patient" element={<PatientSignup />} />
        <Route path="/signup/admin"   element={<AdminSignup />} />
        <Route path="/signup/doctor"  element={<DoctorSignup />} />
        <Route path="/signup/staff"   element={<StaffSignup />} />
        <Route path="/pending"        element={<PendingApproval />} />
        <Route path="/unauthorized"   element={<UnauthorizedPage />} />

        {/* Protected dashboards — ComingSoon until Phase 3+ */}
        <Route path="/reception" element={
          <ProtectedRoute allowedRoles={['staff', 'admin']}>
            <ComingSoon name="Reception Dashboard" />
          </ProtectedRoute>
        } />
        <Route path="/doctor" element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <ComingSoon name="Doctor Dashboard" />
          </ProtectedRoute>
        } />
        <Route path="/admin/*" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <ComingSoon name="Admin Dashboard" />
          </ProtectedRoute>
        } />
        <Route path="/patient/*" element={
          <ProtectedRoute allowedRoles={['patient']}>
            <ComingSoon name="Patient Portal" />
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {!user && <Footer />}
    </BrowserRouter>
  )
}

export default App