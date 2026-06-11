'use client'

import React from 'react'
import Button from './Button'

export default function EmptyState({
  title,
  description,
  actionLabel,
  onActionClick,
  id,
  className = '',
  ...props
}) {
  return (
    <div
      id={id}
      className={`flex flex-col items-center justify-center text-center p-8 border border-dashed border-grey-light rounded-lg bg-off-white/50 my-6 ${className}`}
      {...props}
    >
      <div className="w-12 h-12 bg-grey-light rounded-full flex items-center justify-center text-grey-mid font-semibold text-lg mb-4">
        ⛳
      </div>
      <h3 className="text-base font-bold text-black mb-1">{title}</h3>
      <p className="text-sm text-grey-mid max-w-sm mb-5">{description}</p>
      
      {actionLabel && onActionClick && (
        <Button variant="primary" onClick={onActionClick}>
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
