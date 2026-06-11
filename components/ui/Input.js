'use client'

import React, { forwardRef } from 'react'

const Input = forwardRef(({
  label,
  name,
  type = 'text',
  placeholder,
  error,
  disabled = false,
  className = '',
  id,
  ...props
}, ref) => {
  return (
    <div className="w-full flex flex-col space-y-1.5 mb-4">
      {label && (
        <label
          htmlFor={id || name}
          className="text-xs font-semibold text-grey-mid uppercase tracking-wider"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={ref}
          type={type}
          name={name}
          id={id || name}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full bg-white text-black border px-3.5 py-2.5 text-sm transition-all duration-200 outline-none min-h-[44px] rounded-[8px] ${
            error
              ? 'border-red-soft focus:border-red-soft focus:ring-1 focus:ring-red-soft'
              : 'border-grey-light focus:border-green-dark focus:ring-1 focus:ring-green-dark'
          } ${disabled ? 'bg-off-white text-grey-mid cursor-not-allowed' : ''} ${className}`}
          {...props}
        />
      </div>
      {/* Design System Rule: Error states should be red-soft text below the input, never inside */}
      {error && (
        <span className="text-xs text-red-soft mt-1" id={`${id || name}-error`}>
          {error.message || error}
        </span>
      )}
    </div>
  )
})

Input.displayName = 'Input'

export default Input
