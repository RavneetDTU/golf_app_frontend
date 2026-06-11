'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { toast } from 'react-hot-toast'
import useAuthStore from '../../../store/useAuthStore'
import { loginUser } from '../../../lib/api'
import PageWrapper from '../../../components/layout/PageWrapper'
import Card from '../../../components/ui/Card'
import Input from '../../../components/ui/Input'
import Button from '../../../components/ui/Button'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
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
      email: '',
      password: ''
    }
  })

  useEffect(() => {
    initialize()
  }, [initialize])

  useEffect(() => {
    // If user is already authenticated, don't allow access to login page
    if (token) {
      router.replace('/dashboard')
    }
  }, [token, router])

  const onSubmit = async (data) => {
    setIsSubmitting(true)
    try {
      const response = await loginUser({
        email: data.email,
        password: data.password
      })
      
      const { user, access_token } = response.data
      
      // Map backend full_name to standard UI name
      user.name = user.full_name
      
      // Save session inside store and localstorage
      login(user, access_token)
      
      toast.success(`Welcome back, ${user.name}!`)
      router.push('/dashboard')
    } catch (error) {
      console.error('Login error:', error)
      const message = error.response?.data?.message || 'Invalid email or password.'
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <PageWrapper className="flex flex-col items-center justify-center min-h-[75vh]">
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
              Welcome back
            </h1>
            <p className="text-sm text-grey-mid">
              Sign in to your account
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
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

            {/* Password Input with Visibility Toggle */}
            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                error={errors.password}
                {...register('password', {
                  required: 'Password is required'
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

            {/* Sign In Button */}
            <Button
              type="submit"
              variant="primary"
              loading={isSubmitting}
              className="w-full mt-4 text-base font-semibold py-3 h-11"
            >
              Sign In
            </Button>
          </form>

          {/* Account Creation Link */}
          <div className="mt-6 text-center text-sm text-grey-mid">
            Don&apos;t have an account?{' '}
            <Link
              href="/register"
              className="text-green-dark hover:text-green-mid font-semibold hover:underline"
            >
              Create one →
            </Link>
          </div>
        </Card>
      </div>
    </PageWrapper>
  )
}
