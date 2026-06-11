'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { toast } from 'react-hot-toast'
import useAuthStore from '../../../store/useAuthStore'
import { registerUser } from '../../../lib/api'
import PageWrapper from '../../../components/layout/PageWrapper'
import Card from '../../../components/ui/Card'
import Input from '../../../components/ui/Input'
import Button from '../../../components/ui/Button'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const { login, token, initialize } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      handicap: 0.0
    }
  })

  useEffect(() => {
    initialize()
  }, [initialize])

  useEffect(() => {
    // If user is already authenticated, don't allow access to register page
    if (token) {
      router.replace('/dashboard')
    }
  }, [token, router])

  const onSubmit = async (data) => {
    setIsSubmitting(true)
    try {
      const payload = {
        full_name: data.name,
        email: data.email,
        password: data.password,
        handicap: data.handicap === '' ? 0.0 : parseFloat(data.handicap)
      }
      
      const response = await registerUser(payload)
      const { user, access_token } = response.data
      
      // Map backend full_name to standard UI name
      user.name = user.full_name
      
      // Store session and login
      login(user, access_token)
      
      toast.success(`Account created! Welcome, ${user.name}`)
      router.push('/dashboard')
    } catch (error) {
      console.error('Registration error:', error)
      const message = error.response?.data?.message || 'Failed to create account. Please try again.'
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <PageWrapper className="flex flex-col items-center justify-center min-h-[80vh]">
      <div className="w-full max-w-md">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center space-x-2 text-sm text-grey-mid hover:text-black transition-colors mb-6 group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span className="font-medium">Back to Home</span>
        </Link>

        <Card className="shadow-sm border border-grey-light p-6 md:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold font-display text-green-dark mb-1">
              Create your account
            </h1>
            <p className="text-sm text-grey-mid font-medium">
              Join the club leaderboard and track your rounds
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {/* Full Name Input */}
            <Input
              label="Full Name"
              type="text"
              placeholder="e.g. John Doe"
              error={errors.name}
              {...register('name', {
                required: 'Full name is required',
                minLength: {
                  value: 2,
                  message: 'Name must be at least 2 characters long'
                }
              })}
            />

            {/* Email Input */}
            <Input
              label="Email"
              type="email"
              placeholder="e.g. golfer@domain.co.za"
              error={errors.email}
              {...register('email', {
                required: 'Email address is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address format'
                }
              })}
            />

            {/* Password Input */}
            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Minimum 8 characters"
                error={errors.password}
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 8,
                    message: 'Password must be at least 8 characters long'
                  }
                })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[36px] text-grey-mid hover:text-black focus:outline-none p-1 cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Handicap Input */}
            <div className="mb-6">
              <Input
                label="Handicap (optional)"
                type="number"
                step="0.1"
                min="0.0"
                max="54.0"
                placeholder="0.0"
                error={errors.handicap}
                {...register('handicap', {
                  min: {
                    value: 0.0,
                    message: 'Handicap must be at least 0.0'
                  },
                  max: {
                    value: 54.0,
                    message: 'Handicap cannot exceed 54.0'
                  }
                })}
              />
              <p className="text-xs text-grey-mid -mt-2 font-medium">
                You can update this later. Handicap ranges from 0 to 54.
              </p>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              loading={isSubmitting}
              className="w-full text-base font-semibold py-3 h-11"
            >
              Create Account
            </Button>
          </form>

          {/* Sign In Link */}
          <div className="mt-6 text-center text-sm text-grey-mid">
            Already have an account?{' '}
            <Link
              href="/login"
              className="text-green-dark hover:text-green-mid font-semibold hover:underline"
            >
              Sign in →
            </Link>
          </div>
        </Card>
      </div>
    </PageWrapper>
  )
}
