'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import useAuthStore from '../store/useAuthStore'

export default function useAuth() {
  const router = useRouter()
  const { token, isLoading, initialize, user } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  useEffect(() => {
    if (!isLoading && !token) {
      router.push('/login')
    }
  }, [token, isLoading, router])

  return { token, isLoading, user }
}
