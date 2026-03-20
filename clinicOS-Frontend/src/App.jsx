import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import ProtectedRoute from './components/layout/ProtectedRoute'
import AdminLayout      from './components/layout/AdminLayout'
import AdminOverview    from './pages/admin/AdminOverview'
import JoinRequests     from './pages/admin/JoinRequests'
import TeamManagement   from './pages/admin/TeamManagement'
import ClinicSettings   from './pages/admin/ClinicSettings'
import ReceptionDashboard from './pages/reception/ReceptionDashboard'

// Pages
import HomePage         from './pages/HomePage'
import LoginPage        from './pages/auth/LoginPage'
import RoleSelector     from './pages/auth/RoleSelector'
import PatientSignup    from './pages/auth/PatientSignup'
import AdminSignup      from './pages/auth/AdminSignup'
import DoctorSignup     from './pages/auth/DoctorSignup'
import StaffSignup      from './pages/auth/StaffSignup'
import PendingApproval  from './pages/auth/PendingApproval'
import ForgotPassword   from './pages/auth/ForgotPassword'
import ResetPassword    from './pages/auth/ResetPassword'
import UnauthorizedPage from './pages/auth/UnauthorizedPage'

// Routes where public Navbar/Footer should be hidden
const HIDE_NAV_ROUTES = [
  '/pending',
  '/unauthorized',
]

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

// Separate component so we can use useLocation inside BrowserRouter
function AppContent() {
  const { user }   = useAuth()
  const location   = useLocation()

  // Hide public navbar+footer on auth pages AND on all dashboard pages
  const isAuthPage      = HIDE_NAV_ROUTES.some(r => location.pathname.startsWith(r))
  const isDashboardPage = user !== null
  const showPublicNav   = !isAuthPage && !isDashboardPage

  return (
    <>
      {showPublicNav && <Navbar />}

      <Routes>
        {/* Public */}
        <Route path="/" element={<HomePage />} />
        <Route
          path="/login"
          element={user ? <Navigate to={getDashboardRoute(user.role)} replace /> : <LoginPage />}
        />
        <Route path="/signup"              element={<RoleSelector />} />
        <Route path="/signup/patient"      element={<PatientSignup />} />
        <Route path="/signup/admin"        element={<AdminSignup />} />
        <Route path="/signup/doctor"       element={<DoctorSignup />} />
        <Route path="/signup/staff"        element={<StaffSignup />} />
        <Route path="/pending"             element={<PendingApproval />} />
        <Route path="/forgot-password"     element={<ForgotPassword />} />
        <Route path="/reset-password"      element={<ResetPassword />} />
        <Route path="/unauthorized"        element={<UnauthorizedPage />} />

        {/* Protected dashboards */}
        <Route path="/reception" element={
          <ProtectedRoute allowedRoles={['staff', 'admin']}>
            <ReceptionDashboard />
          </ProtectedRoute>
        } />
        <Route path="/doctor" element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <ComingSoon name="Doctor Dashboard" />
          </ProtectedRoute>
        } />
        <Route path="/admin" element={
  <ProtectedRoute allowedRoles={['admin']}>
    <AdminLayout />
  </ProtectedRoute>
}>
  <Route index          element={<AdminOverview />} />
  <Route path="requests" element={<JoinRequests />} />
  <Route path="team"     element={<TeamManagement />} />
  <Route path="settings" element={<ClinicSettings />} />
</Route>
        <Route path="/patient/*" element={
          <ProtectedRoute allowedRoles={['patient']}>
            <ComingSoon name="Patient Portal" />
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {showPublicNav && <Footer />}
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}

export default App