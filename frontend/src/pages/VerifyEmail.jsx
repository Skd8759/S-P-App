import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useForm } from 'react-hook-form'
import { Mail, ArrowLeft, RefreshCw, CheckCircle } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'

const VerifyEmail = () => {
  const { user, verifyEmail, resendVerificationOTP, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    if (user?.isEmailVerified) {
      navigate('/dashboard')
      return
    }
  }, [isAuthenticated, user, navigate])

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  const onSubmit = async (data) => {
    setIsSubmitting(true)
    try {
      const result = await verifyEmail(data.otp)
      if (result.success) {
        navigate('/dashboard')
      }
    } catch (error) {
      console.error('Email verification error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return

    setIsResending(true)
    try {
      const result = await resendVerificationOTP()
      if (result.success) {
        setResendCooldown(60) // 60 seconds cooldown
      }
    } catch (error) {
      console.error('Resend OTP error:', error)
    } finally {
      setIsResending(false)
    }
  }

  if (!user) {
    return <LoadingSpinner />
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
            <Mail className="w-8 h-8 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          Verify your email
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          We've sent a verification code to
        </p>
        <p className="text-center text-sm font-medium text-primary-600">
          {user.email}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="mb-6">
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-center text-sm text-gray-600">
              Please check your email and enter the 6-digit verification code below.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
                Verification Code
              </label>
              <div className="mt-1">
                <input
                  {...register('otp', {
                    required: 'Verification code is required',
                    pattern: {
                      value: /^[0-9]{6}$/,
                      message: 'Please enter a valid 6-digit code'
                    }
                  })}
                  type="text"
                  maxLength="6"
                  className="input text-center text-2xl tracking-widest"
                  placeholder="000000"
                />
              </div>
              {errors.otp && (
                <p className="mt-1 text-sm text-red-600">{errors.otp.message}</p>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary btn-lg w-full"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <LoadingSpinner size="sm" className="mr-2" />
                    Verifying...
                  </div>
                ) : (
                  'Verify Email'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Didn't receive the code?</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={handleResendOTP}
                disabled={isResending || resendCooldown > 0}
                className="btn btn-outline btn-lg w-full"
              >
                {isResending ? (
                  <div className="flex items-center justify-center">
                    <LoadingSpinner size="sm" className="mr-2" />
                    Sending...
                  </div>
                ) : resendCooldown > 0 ? (
                  `Resend in ${resendCooldown}s`
                ) : (
                  <div className="flex items-center justify-center">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Resend Code
                  </div>
                )}
              </button>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">
              Important Notes:
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Check your spam/junk folder if you don't see the email</li>
              <li>• The verification code expires in 10 minutes</li>
              <li>• You can request a new code after 1 minute</li>
              <li>• Make sure you're using your NITK email address</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to home
        </button>
      </div>
    </div>
  )
}

export default VerifyEmail
