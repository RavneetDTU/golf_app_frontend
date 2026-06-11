'use client'

import React from 'react'

export default function ScanPreview({ imageUrl, isScanning }) {
  if (!imageUrl) return null

  return (
    <div className={`relative w-full max-w-sm mx-auto overflow-hidden rounded-[8px] border transition-all duration-300 ${
      isScanning 
        ? 'border-green-dark animate-pulse shadow-[0_0_15px_rgba(27,67,50,0.4)]' 
        : 'border-grey-light'
    }`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img 
        src={imageUrl} 
        alt="Scorecard Scan Preview" 
        className="w-full h-auto object-cover max-h-64"
      />
      {isScanning && (
        <div className="absolute inset-0 bg-green-dark/15 flex items-center justify-center">
          <div className="bg-white/95 px-4 py-2 rounded-[6px] border border-green-dark shadow-sm">
            <p className="text-xs font-semibold text-green-dark animate-pulse text-center">Reading scorecard...</p>
          </div>
        </div>
      )}
    </div>
  )
}
