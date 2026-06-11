'use client'

import React from 'react'

export default function PageWrapper({ children, className = '' }) {
  return (
    <main className={`max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-10 pb-24 md:pb-10 transition-all ${className}`}>
      {children}
    </main>
  )
}
