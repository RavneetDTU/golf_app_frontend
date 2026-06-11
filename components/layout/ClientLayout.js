'use client'

import React, { useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import useAuthStore from '../../store/useAuthStore'
import Navbar from './Navbar'
import BottomNav from './BottomNav'

export default function ClientLayout({ children }) {
  const initialize = useAuthStore((state) => state.initialize)

  useEffect(() => {
    initialize()
  }, [initialize])

  return (
    <>
      <Navbar />
      <div className="min-h-screen flex flex-col bg-white">
        <div className="flex-1">
          {children}
        </div>
      </div>
      <BottomNav />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#FFFFFF',
            color: '#0A0A0A',
            border: '1px solid #E9ECEF',
            borderRadius: '8px',
            fontSize: '14px',
            padding: '12px 16px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
          },
          success: {
            iconTheme: {
              primary: '#1B4332',
              secondary: '#FFFFFF',
            },
          },
          error: {
            iconTheme: {
              primary: '#FF6B6B',
              secondary: '#FFFFFF',
            },
          },
        }}
      />
    </>
  )
}
