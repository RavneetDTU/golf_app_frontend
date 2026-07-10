'use client'

import React from 'react'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import { AlertCircle } from 'lucide-react'

export default function AdminDisputeRow({ dispute, onResolve }) {
  const {
    id,
    score_owner_name,
    player_name,
    raised_by_name,
    reason,
    status
  } = dispute

  const isClosed = status === 'resolved' || status === 'dismissed'
  const playerName = score_owner_name || player_name || 'Unknown Player'

  return (
    <tr className="border-b border-grey-light hover:bg-off-white/40 transition-colors">
      <td className="py-3 px-4 font-semibold text-black text-sm">
        {playerName}
      </td>
      <td className="py-3 px-4 text-grey-mid text-sm">
        {raised_by_name || 'System'}
      </td>
      <td className="py-3 px-4 text-grey-mid text-xs max-w-[200px] truncate" title={reason}>
        {reason || '-'}
      </td>
      <td className="py-3 px-4 text-center">
        {status === 'open' ? (
          <Badge variant="neutral" className="bg-[#FFF3CD] text-[#856404] border border-[#FFEEBA]/40">Open</Badge>
        ) : (
          <Badge variant="success">Resolved</Badge>
        )}
      </td>
      <td className="py-3 px-4 text-center">
        {!isClosed ? (
          <Button
            variant="primary"
            onClick={() => onResolve(dispute)}
            className="min-h-0 h-8 text-xs py-0 px-3 flex items-center justify-center space-x-1"
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Resolve</span>
          </Button>
        ) : (
          <span className="text-xs text-grey-mid/60 font-semibold uppercase">Closed</span>
        )}
      </td>
    </tr>
  )
}
