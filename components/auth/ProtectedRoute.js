'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import useAuthStore from '../../store/useAuthStore'
import Skeleton from '../ui/Skeleton'
import PageWrapper from '../layout/PageWrapper'

export default function ProtectedRoute({ children }) {
  const router = useRouter()
  const { token, isLoading, initialize } = useAuthStore()

  useEffect(() => {
    // Make sure we initialize store from localStorage first
    initialize()
  }, [initialize])

  useEffect(() => {
    // If initialization is complete and there's no token, redirect to login page
    if (!isLoading && !token) {
      router.push('/login')
    }
  }, [token, isLoading, router])

  // Show a premium skeletal load structure while checking auth status
  if (isLoading || !token) {
    return (
      <PageWrapper>
        <div className="space-y-6">
          <Skeleton variant="text" className="h-8 w-1/3 mb-4" />
          <Skeleton variant="rect" className="h-32 rounded-lg" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton variant="rect" className="h-48 rounded-lg" />
            <Skeleton variant="rect" className="h-48 rounded-lg" />
          </div>
        </div>
      </PageWrapper>
    )
  }

  // Render original children if authenticated
  return <>{children}</>
}
