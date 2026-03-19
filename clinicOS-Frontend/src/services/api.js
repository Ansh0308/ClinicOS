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
export default api