import React, { createContext, useContext, useReducer, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

const AuthContext = createContext()

const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  isLoading: true,
}

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        isLoading: true,
      }
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
      }
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      }
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      }
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      }
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      }
    default:
      return state
  }
}

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // Set up axios defaults
  useEffect(() => {
    if (state.token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${state.token}`
      localStorage.setItem('token', state.token)
    } else {
      delete axios.defaults.headers.common['Authorization']
      localStorage.removeItem('token')
    }
  }, [state.token])

  // Check if user is logged in on app start
  useEffect(() => {
    const checkAuth = async () => {
      if (state.token) {
        try {
          const response = await axios.get('/api/auth/me')
          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: {
              user: response.data.data.user,
              token: state.token,
            },
          })
        } catch (error) {
          console.error('Auth check failed:', error)
          dispatch({ type: 'LOGIN_FAILURE' })
        }
      } else {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    }

    checkAuth()
  }, [])

  const login = async (email, password) => {
    dispatch({ type: 'LOGIN_START' })
    try {
      const response = await axios.post('/api/auth/login', {
        email,
        password,
      })

      const { user, token } = response.data.data

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user, token },
      })

      toast.success('Login successful!')
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed'
      dispatch({ type: 'LOGIN_FAILURE' })
      toast.error(message)
      return { success: false, message }
    }
  }

  const register = async (userData) => {
    try {
      const response = await axios.post('/api/auth/register', userData)
      const { user, token } = response.data.data

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user, token },
      })

      toast.success('Registration successful! Please verify your email.')
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed'
      toast.error(message)
      return { success: false, message }
    }
  }

  const verifyEmail = async (otp) => {
    try {
      const response = await axios.post('/api/auth/verify-email', { otp })
      const { user } = response.data.data

      dispatch({
        type: 'UPDATE_USER',
        payload: user,
      })

      toast.success('Email verified successfully!')
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Email verification failed'
      toast.error(message)
      return { success: false, message }
    }
  }

  const resendVerificationOTP = async () => {
    try {
      await axios.post('/api/auth/resend-verification-otp')
      toast.success('Verification OTP sent to your email!')
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to send OTP'
      toast.error(message)
      return { success: false, message }
    }
  }

  const forgotPassword = async (email) => {
    try {
      await axios.post('/api/auth/forgot-password', { email })
      toast.success('Password reset OTP sent to your email!')
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to send reset OTP'
      toast.error(message)
      return { success: false, message }
    }
  }

  const resetPassword = async (email, otp, newPassword) => {
    try {
      await axios.post('/api/auth/reset-password', {
        email,
        otp,
        newPassword,
      })
      toast.success('Password reset successful!')
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Password reset failed'
      toast.error(message)
      return { success: false, message }
    }
  }

  const logout = async () => {
    try {
      await axios.post('/api/auth/logout')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      dispatch({ type: 'LOGOUT' })
      toast.success('Logged out successfully!')
    }
  }

  const updateUser = (userData) => {
    dispatch({
      type: 'UPDATE_USER',
      payload: userData,
    })
  }

  const value = {
    ...state,
    login,
    register,
    verifyEmail,
    resendVerificationOTP,
    forgotPassword,
    resetPassword,
    logout,
    updateUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
