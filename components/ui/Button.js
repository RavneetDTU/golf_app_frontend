'use client'

import React from 'react'

export default function Button({
  children,
  type = 'button',
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'text' | 'danger'
  loading = false,
  disabled = false,
  onClick,
  className = '',
  id,
  ...props
}) {
  // Base styling rules: 6px radius, 44px minimum height
  const baseStyle = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none min-h-[44px] px-5 py-2 text-sm rounded-[6px] cursor-pointer'
  
  // Custom variants styled to match color design tokens
  const variants = {
    primary: 'bg-green-dark text-white hover:bg-green-mid disabled:bg-grey-mid/40 disabled:text-grey-mid disabled:cursor-not-allowed',
    secondary: 'bg-off-white text-black hover:bg-grey-light border border-grey-light disabled:bg-grey-light disabled:text-grey-mid disabled:cursor-not-allowed',
    outline: 'bg-transparent text-green-dark border-2 border-green-dark hover:bg-green-light/20 disabled:border-grey-light disabled:text-grey-mid disabled:cursor-not-allowed',
    text: 'bg-transparent text-green-dark hover:text-green-mid disabled:text-grey-mid disabled:cursor-not-allowed min-h-0 py-1.5 px-3',
    danger: 'bg-red-soft/10 text-red-500 hover:bg-red-soft/20 disabled:bg-grey-light disabled:text-grey-mid disabled:cursor-not-allowed border border-red-soft/20'
  }

  const handleClick = (e) => {
    if (disabled || loading) {
      e.preventDefault()
      return
    }
    if (onClick) {
      onClick(e)
    }
  }

  return (
    <button
      id={id}
      type={type}
      disabled={disabled || loading}
      onClick={handleClick}
      className={`${baseStyle} ${variants[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="flex items-center space-x-2">
          {/* Subtle horizontal pulse text loader instead of spinner */}
          <span className="animate-pulse">Loading...</span>
        </span>
      ) : (
        children
      )}
    </button>
  )
}
