'use client'

import React, { useState } from 'react'
import Button from '../ui/Button'
import { Check, X, Edit3, AlertTriangle } from 'lucide-react'

export default function PendingActions({
  onApprove,
  onReject,
  onEditSubmit,
  isLoading,
  actionType // 'approve' | 'reject' | 'edit' | null
}) {
  const [confirmReject, setConfirmReject] = useState(false)

  if (confirmReject) {
    return (
      <div className="flex flex-col sm:flex-row items-center justify-between p-3.5 bg-red-soft/5 border border-red-soft/20 rounded-[8px] gap-3 w-full animate-fade-in">
        <div className="flex items-center space-x-2 text-red-500 text-xs sm:text-sm font-semibold">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>Reject this scorecard? This action cannot be undone.</span>
        </div>
        <div className="flex space-x-3 w-full sm:w-auto">
          <Button
            variant="secondary"
            onClick={() => setConfirmReject(false)}
            disabled={isLoading}
            className="flex-1 sm:flex-initial h-9 min-h-[36px] py-1 text-xs"
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              setConfirmReject(false)
              onReject()
            }}
            loading={isLoading && actionType === 'reject'}
            disabled={isLoading}
            className="flex-1 sm:flex-initial h-9 min-h-[36px] py-1 text-xs"
          >
            Yes, Reject
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3 w-full">
      {/* Approve button - Solid Green */}
      <Button
        variant="primary"
        onClick={onApprove}
        loading={isLoading && actionType === 'approve'}
        disabled={isLoading}
        className="flex-1 flex items-center justify-center space-x-1.5 h-10 min-h-[40px] text-xs font-semibold bg-green-dark hover:bg-green-mid"
      >
        <Check className="w-4 h-4" />
        <span>Approve</span>
      </Button>

      {/* Reject button - Outlined Red */}
      <Button
        variant="danger"
        onClick={() => setConfirmReject(true)}
        disabled={isLoading}
        className="flex-1 flex items-center justify-center space-x-1.5 h-10 min-h-[40px] text-xs font-semibold bg-transparent text-red-500 hover:bg-red-soft/10 border border-red-soft/30"
      >
        <X className="w-4 h-4" />
        <span>Reject</span>
      </Button>

      {/* Edit & Submit button - Outlined Green-Dark */}
      <Button
        variant="outline"
        onClick={onEditSubmit}
        disabled={isLoading}
        className="flex-1 flex items-center justify-center space-x-1.5 h-10 min-h-[40px] text-xs font-semibold"
      >
        <Edit3 className="w-4 h-4" />
        <span>Edit & Submit</span>
      </Button>
    </div>
  )
}
