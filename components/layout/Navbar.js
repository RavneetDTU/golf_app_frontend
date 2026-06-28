'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import useAuthStore from '../../store/useAuthStore'
import { Menu, ChevronDown, LogOut, ShieldAlert, Shield } from 'lucide-react'

export default function Navbar() {
  const pathname = usePathname()
  const { user, logout, token } = useAuthStore()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  // Navigation items only visible when user is logged in
  const navItems = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Clubs', href: '/clubs' }
  ]

  const handleLogout = () => {
    setDropdownOpen(false)
    logout()
  }

  // Helper to check if item is active
  const isActive = (href) => {
    return pathname === href
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-grey-light h-16">
      <div className="max-w-6xl mx-auto px-4 md:px-8 h-full flex items-center justify-between">
        {/* Left Side: Logo & Name */}
        <Link href={token ? '/dashboard' : '/'} className="flex items-center space-x-2">
          <span className="text-xl font-bold font-display text-green-dark tracking-wide flex items-center gap-1">
            ⛳ Golf Club Scorer
          </span>
        </Link>

        {/* Center: Main Nav Links (Desktop Only) */}
        {token && (
          <nav className="hidden md:flex items-center space-x-8 h-full">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`h-full flex items-center border-b-2 text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? 'border-green-dark text-green-dark'
                    : 'border-transparent text-grey-mid hover:text-black hover:border-grey-light'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}

        {/* Right Side: Auth State or Sign In Button */}
        <div className="flex items-center space-x-4">
          {token && user ? (
            <div className="relative">
              {/* Trigger */}
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-2 text-sm font-medium py-2 px-3 rounded-md hover:bg-off-white transition-colors border border-transparent focus:border-grey-light"
                id="user-dropdown-btn"
              >
                <div className="w-8 h-8 rounded-full bg-green-light text-green-dark font-semibold flex items-center justify-center">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="hidden sm:inline-block text-black font-medium">{user.name}</span>
                <ChevronDown className="w-4 h-4 text-grey-mid" />
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <>
                  {/* Backdrop overlay to close when clicking outside */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setDropdownOpen(false)}
                  ></div>
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-grey-light rounded-md shadow-lg py-1 z-20">
                    <div className="px-4 py-2 border-b border-grey-light">
                      <p className="text-xs text-grey-mid">Logged in as</p>
                      <p className="text-sm font-semibold text-black truncate">{user.email}</p>
                      {user.handicap !== undefined && (
                        <p className="text-xs text-green-dark font-medium mt-0.5">
                          Handicap: {parseFloat(user.handicap).toFixed(1)}
                        </p>
                      )}
                    </div>
                    
                    {user.is_admin && (
                      <Link
                        href="/admin"
                        onClick={() => setDropdownOpen(false)}
                        className="w-full px-4 py-2.5 text-sm text-black hover:bg-off-white flex items-center space-x-2 transition-colors border-b border-grey-light"
                      >
                        <Shield className="w-4 h-4 text-green-dark" />
                        <span>Admin Panel</span>
                      </Link>
                    )}

                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-off-white flex items-center space-x-2 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="hidden md:flex items-center space-x-3">
              <Link
                href="/login"
                className="text-sm font-medium text-green-dark hover:text-green-mid transition-colors py-2 px-3"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="text-sm font-medium bg-green-dark text-white hover:bg-green-mid transition-colors py-2 px-4 rounded-[6px]"
              >
                Create Account
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
