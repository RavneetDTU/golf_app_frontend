'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import useAuthStore from '../../store/useAuthStore'
import { Home, PlusCircle, Trophy, User, LogOut, X } from 'lucide-react'

export default function BottomNav() {
  const pathname = usePathname()
  const { user, token, logout } = useAuthStore()
  const [profileModalOpen, setProfileModalOpen] = useState(false)

  // Don't render if not authenticated
  if (!token) return null

  const navItems = [
    { label: 'Home', href: '/dashboard', icon: Home },
    { label: 'Add Score', href: '/scores/new', icon: PlusCircle },
    { label: 'Clubs', href: '/clubs', icon: Trophy }
  ]

  const isActive = (href) => {
    return pathname === href
  }

  return (
    <>
      {/* Mobile Navigation Bar (hidden on desktop) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-grey-light flex items-center justify-around z-40 pb-safe shadow-md">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center flex-1 h-full py-1 text-xs"
            >
              <Icon
                className={`w-6 h-6 transition-colors ${
                  active ? 'text-green-dark' : 'text-grey-mid hover:text-black'
                }`}
              />
              <span
                className={`mt-1 font-medium transition-colors ${
                  active ? 'text-green-dark' : 'text-grey-mid hover:text-black'
                }`}
              >
                {item.label}
              </span>
            </Link>
          )
        })}

        {/* Profile Tab */}
        <button
          onClick={() => setProfileModalOpen(true)}
          className="flex flex-col items-center justify-center flex-1 h-full py-1 text-xs text-grey-mid hover:text-black"
        >
          <User className="w-6 h-6" />
          <span className="mt-1 font-medium">Profile</span>
        </button>
      </nav>

      {/* Mobile Profile Drawer/Modal */}
      {profileModalOpen && user && (
        <div className="fixed inset-0 z-50 flex items-end justify-center md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setProfileModalOpen(false)}
          ></div>
          
          {/* Content panel */}
          <div className="relative w-full max-w-md bg-white rounded-t-2xl shadow-xl px-6 pt-5 pb-8 border-t border-grey-light z-10 transition-transform transform translate-y-0">
            {/* Handle bar for visual queue */}
            <div className="w-12 h-1 bg-grey-light rounded-full mx-auto mb-4"></div>
            
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold font-display text-green-dark">My Profile</h3>
              <button
                onClick={() => setProfileModalOpen(false)}
                className="p-1 rounded-full hover:bg-off-white text-grey-mid"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-green-light text-green-dark font-bold flex items-center justify-center text-lg">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <p className="font-bold text-black text-base">{user.name}</p>
                <p className="text-sm text-grey-mid">{user.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-off-white p-3 rounded-lg border border-grey-light">
                <p className="text-xs text-grey-mid mb-1">Handicap</p>
                <p className="text-lg font-bold numeral-mono text-green-dark">
                  {user.handicap !== undefined ? parseFloat(user.handicap).toFixed(1) : '0.0'}
                </p>
              </div>
              <div className="bg-off-white p-3 rounded-lg border border-grey-light">
                <p className="text-xs text-grey-mid mb-1">App Version</p>
                <p className="text-sm font-semibold text-black mt-1">Phase 1 v1.0</p>
              </div>
            </div>

            <button
              onClick={() => {
                setProfileModalOpen(false)
                logout()
              }}
              className="w-full h-11 flex items-center justify-center space-x-2 bg-red-soft/10 text-red-500 rounded-md font-semibold hover:bg-red-soft/20 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </>
  )
}
