'use client'

import React from 'react'

export default function Skeleton({
  variant = 'text', // 'text' | 'rect' | 'circle'
  className = '',
  id,
  ...props
}) {
  const baseClass = 'skeleton' // defined in globals.css with keyframe animation
  
  const variants = {
    text: 'h-4 w-full my-1.5',
    rect: 'h-24 w-full',
    circle: 'h-12 w-12 rounded-full'
  }

  return (
    <div
      id={id}
      className={`${baseClass} ${variants[variant]} ${className}`}
      {...props}
    />
  )
}
