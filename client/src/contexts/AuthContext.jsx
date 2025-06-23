import React, { createContext, useContext, useState, useEffect } from 'react'

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
  const [token, setToken] = useState(localStorage.getItem('access_token'))

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

  useEffect(() => {
    if (token) {
      fetchUser()
    } else {
      setLoading(false)
    }
  }, [token])

  const fetchUser = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.data.user)
      } else {
        logout()
      }
    } catch (error) {
      console.error('Failed to fetch user:', error)
      logout()
    } finally {
      setLoading(false)
    }
  }

  const login = async (username, password, twoFactorCode = null) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username,
          password,
          two_factor_code: twoFactorCode
        })
      })

      const data = await response.json()

      if (data.success) {
        const { access_token, refresh_token, user } = data.data
        localStorage.setItem('access_token', access_token)
        localStorage.setItem('refresh_token', refresh_token)
        setToken(access_token)
        setUser(user)
        return { success: true, user }
      } else if (data.requires_2fa) {
        return { success: false, requires2FA: true, message: data.message }
      } else {
        return { success: false, message: data.message || '로그인에 실패했습니다.' }
      }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, message: '네트워크 오류가 발생했습니다.' }
    }
  }

  const register = async (username, email, password, fullName = '') => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username,
          email,
          password,
          full_name: fullName
        })
      })

      const data = await response.json()

      if (data.success) {
        const { access_token, refresh_token, user } = data.data
        localStorage.setItem('access_token', access_token)
        localStorage.setItem('refresh_token', refresh_token)
        setToken(access_token)
        setUser(user)
        return { success: true, user, message: data.message }
      } else {
        return { success: false, message: data.detail || '회원가입에 실패했습니다.' }
      }
    } catch (error) {
      console.error('Register error:', error)
      return { success: false, message: '네트워크 오류가 발생했습니다.' }
    }
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setToken(null)
    setUser(null)
  }

  const refreshToken = async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token')
      if (!refreshToken) {
        logout()
        return false
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refresh_token: refreshToken })
      })

      if (response.ok) {
        const data = await response.json()
        const { access_token, refresh_token: newRefreshToken } = data.data
        localStorage.setItem('access_token', access_token)
        localStorage.setItem('refresh_token', newRefreshToken)
        setToken(access_token)
        return true
      } else {
        logout()
        return false
      }
    } catch (error) {
      console.error('Token refresh error:', error)
      logout()
      return false
    }
  }

  const updateProfile = async (profileData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileData)
      })

      const data = await response.json()

      if (data.success) {
        setUser(data.data.user)
        return { success: true, message: data.message }
      } else {
        return { success: false, message: data.detail || '프로필 업데이트에 실패했습니다.' }
      }
    } catch (error) {
      console.error('Profile update error:', error)
      return { success: false, message: '네트워크 오류가 발생했습니다.' }
    }
  }

  const changePassword = async (currentPassword, newPassword) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword
        })
      })

      const data = await response.json()

      if (data.success) {
        return { success: true, message: data.message }
      } else {
        return { success: false, message: data.detail || '비밀번호 변경에 실패했습니다.' }
      }
    } catch (error) {
      console.error('Password change error:', error)
      return { success: false, message: '네트워크 오류가 발생했습니다.' }
    }
  }

  const apiCall = async (url, options = {}) => {
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers
    }

    try {
      const response = await fetch(`${API_BASE_URL}${url}`, {
        ...options,
        headers
      })

      if (response.status === 401) {
        const refreshed = await refreshToken()
        if (refreshed) {
          // Retry with new token
          const newToken = localStorage.getItem('access_token')
          return fetch(`${API_BASE_URL}${url}`, {
            ...options,
            headers: {
              ...headers,
              'Authorization': `Bearer ${newToken}`
            }
          })
        } else {
          logout()
          throw new Error('Authentication failed')
        }
      }

      return response
    } catch (error) {
      console.error('API call error:', error)
      throw error
    }
  }

  const value = {
    user,
    loading,
    token,
    isAuthenticated: !!user, // ✅ 여기에 추가
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    apiCall,
    API_BASE_URL
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

