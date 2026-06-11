'use client'

import React from 'react'

export default function Badge({
  children,
  variant = 'success', // 'success' | 'rank1' | 'neutral' | 'accent'
  className = '',
  id,
  ...props
}) {
  const styles = {
    // Green-light bg, green-dark text
    success: 'bg-[#D8F3DC] text-[#1B4332] border border-[#2D6A4F]/25',
    // Gold bg, white text - used sparingly for Rank #1
    rank1: 'bg-[#C9A84C] text-white border border-[#C9A84C]',
    // Grey-light bg, grey-mid text
    neutral: 'bg-grey-light text-grey-mid border border-grey-light',
    // Accent green dark bg, white text
    accent: 'bg-green-dark text-white border border-green-dark'
  }

  return (
    <span
      id={id}
      className={`inline-flex items-center px-2 py-0.5 rounded-[4px] text-xs font-semibold uppercase tracking-wider ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  )
}
