'use client'

import React from 'react'

export default function Card({
  children,
  className = '',
  onClick,
  id,
  ...props
}) {
  const isClickable = typeof onClick === 'function'
  
  return (
    <div
      id={id}
      onClick={onClick}
      className={`bg-white border border-grey-light rounded-[8px] p-4 transition-all duration-200 ${
        isClickable ? 'cursor-pointer hover:shadow-md hover:border-grey-mid/30' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
