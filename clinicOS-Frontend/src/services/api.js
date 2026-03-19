import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('clinicos_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// If token expires → clear storage and redirect to login
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

// ── Auth endpoints ────────────────────────────────────────────────────────────
export const authAPI = {
  sendOTP:   (email)             => api.post('/auth/send-otp',   { email }),
  verifyOTP: (email, code)       => api.post('/auth/verify-otp', { email, code }),
  register:  (data)              => api.post('/auth/register',   data),
  login:     (email, password)   => api.post('/auth/login',      { email, password }),
  getMe:     ()                  => api.get('/auth/me'),
}

export default api