import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  // On every app load: check if a saved token exists
  // If yes → ask backend to validate it and return fresh user data
  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem('clinicos_token')

      if (!token) {
        setLoading(false)
        return
      }

      try {
        const res = await authAPI.getMe()
        setUser(res.data.data.user)
      } catch {
        // Token expired or invalid — clean up
        localStorage.removeItem('clinicos_token')
        localStorage.removeItem('clinicos_user')
      } finally {
        setLoading(false)
      }
    }

    restoreSession()
  }, [])

  const login = (userData, token) => {
    localStorage.setItem('clinicos_token', token)
    localStorage.setItem('clinicos_user', JSON.stringify(userData))
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('clinicos_token')
    localStorage.removeItem('clinicos_user')
    setUser(null)
  }

  // Show a loading spinner while checking saved session
  // Prevents logged-in users from seeing a flash of the login page
  if (loading) {
    return (
      <div className="min-h-screen hero-glow flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-crimson-200 border-t-crimson-500 rounded-full animate-spin" />
          <span className="font-body text-text-muted text-sm">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}