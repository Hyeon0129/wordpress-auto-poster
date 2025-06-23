import { createContext, useContext, useState, useEffect } from 'react'
import { API_BASE_URL } from '../lib/api'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(localStorage.getItem('auth_token'))

  useEffect(() => {
    if (token) {
      // 토큰이 있으면 사용자 정보 조회
      fetchUserInfo()
    } else {
      setLoading(false)
    }
  }, [token])

  const fetchUserInfo = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      } else {
        // 토큰이 유효하지 않음
        localStorage.removeItem('auth_token')
        setToken(null)
      }
    } catch (error) {
      console.error('사용자 정보 조회 실패:', error)
      localStorage.removeItem('auth_token')
      setToken(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (username, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      })

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem('auth_token', data.access_token)
        setToken(data.access_token)
        setUser(data.user)
        return { success: true }
      } else {
        return { success: false, error: data.error }
      }
    } catch (error) {
      return { success: false, error: '로그인 중 오류가 발생했습니다.' }
    }
  }

  const register = async (username, email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, email, password })
      })

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem('auth_token', data.access_token)
        setToken(data.access_token)
        setUser(data.user)
        return { success: true }
      } else {
        return { success: false, error: data.error }
      }
    } catch (error) {
      return { success: false, error: '회원가입 중 오류가 발생했습니다.' }
    }
  }

  const logout = () => {
    localStorage.removeItem('auth_token')
    setToken(null)
    setUser(null)
  }

  const value = {
    user,
    loading,
    token,
    login,
    register,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

