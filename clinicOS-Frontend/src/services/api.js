import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('clinicos_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('clinicos_token')
      localStorage.removeItem('clinicos_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authAPI = {
  sendOTP:         (email, checkDuplicate = false) =>
                     api.post('/auth/send-otp', { email, checkDuplicate }),
  verifyOTP:       (email, code)    => api.post('/auth/verify-otp',      { email, code }),
  register:        (data)           => api.post('/auth/register',         data),
  login:           (email, password)=> api.post('/auth/login',            { email, password }),
  getMe:           ()               => api.get('/auth/me'),
  forgotPassword:  (email)          => api.post('/auth/forgot-password',  { email }),
  resetPassword:   (token, password)=> api.post('/auth/reset-password',   { token, password }),
}
export const adminAPI = {
  getStats:          ()          => api.get('/admin/stats'),
  getJoinRequests:   ()          => api.get('/admin/join-requests'),
  reviewRequest:     (id, action)=> api.patch(`/admin/join-requests/${id}`, { action }),
  getTeam:           ()          => api.get('/admin/team'),
  updateMember:      (id, action)=> api.patch(`/admin/team/${id}`, { action }),
  getClinic:         ()          => api.get('/admin/clinic'),
  updateClinic:      (data)      => api.patch('/admin/clinic', data),
}

export const clinicAPI = {
  getDoctors: () => api.get('/admin/doctors'),
}

export const messageAPI = {
  getLogs:  (params) => api.get('/messages',       { params }),
  getStats: ()       => api.get('/messages/stats'),
}

export const patientAPI = {
  lookup:       (phone)         => api.post('/patients/lookup', { phone }),
  create:       (data)          => api.post('/patients', data),
  get:          (id)            => api.get(`/patients/${id}`),
  updateOptIn:  (id, optInMsg)  => api.patch(`/patients/${id}/opt-in`, { optInMsg }),
}

export const patientPortalAPI = {
  getDashboard:        () => api.get('/patient/dashboard'),
  getActiveToken:      () => api.get('/patient/token'),
  getVisits:           () => api.get('/patient/visits'),
  getBills:            () => api.get('/patient/bills'),
  getProfile:          () => api.get('/patient/profile'),
  updateProfile:       (data) => api.patch('/patient/profile', data),
  leaveQueue:          () => api.post('/patient/leave-queue'),
  payBill:             (id, method) => api.post(`/patient/bills/${id}/pay`, { paymentMethod: method }),
  createRazorpayOrder: (id) => api.post(`/patient/bills/${id}/razorpay-order`),
  verifyPayment:       (id, data) => api.post(`/patient/bills/${id}/razorpay-verify`, data),
  getNotifications:    () => api.get('/patient/notifications'),
}

export const tokenAPI = {
  getAll:     ()              => api.get('/tokens'),
  create:     (data)          => api.post('/tokens', data),
  emergency:  (data)          => api.post('/tokens/emergency', data),
  updateStatus: (id, status)  => api.patch(`/tokens/${id}/status`, { status }),
  cancel:     (id)            => api.delete(`/tokens/${id}`),
  pause:      ()              => api.patch('/tokens/queue/pause'),
  resume:     ()              => api.patch('/tokens/queue/resume'),
}

export const visitAPI = {
  create:   (data)       => api.post('/visits', data),
  update:   (id, data)   => api.patch(`/visits/${id}`, data),
  complete: (id)         => api.patch(`/visits/${id}/complete`),
  getPatientVisits:  (patientId) => api.get(`/visits/patients/${patientId}/visits`),
  getPatientProfile: (patientId) => api.get(`/visits/patients/${patientId}/profile`),
}

export const billAPI = {
  create:              (data)      => api.post('/bills', data),
  getAll:              (patientId) => api.get('/bills', { params: { patientId } }),
  get:                 (id)        => api.get(`/bills/${id}`),
  markPaid:            (id, method)=> api.patch(`/bills/${id}/payment`, { paymentMethod: method }),
  createRazorpayOrder: (id)        => api.post(`/bills/${id}/razorpay-order`),
  verifyPayment:       (id, data)  => api.post(`/bills/${id}/razorpay-verify`, data),
}

export default api