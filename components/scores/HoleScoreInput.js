'use client'

import React from 'react'
import { getStrokeAllowance, calculateHolePoints } from '../../lib/stableford'

export default function HoleScoreInput({
  holeData,
  handicap,
  onShotsChange,
  onParChange,
  onSiChange
}) {
  const { hole, par, strokeIndex, shots } = holeData
  
  // Calculate stroke allowance and live points for this specific hole
  const allowance = getStrokeAllowance(handicap, strokeIndex)
  const points = shots > 0 ? calculateHolePoints(shots, par, allowance) : 0

  return (
    <tr className="border-b border-grey-light hover:bg-off-white/40">
      {/* Hole Number */}
      <td className="py-2.5 px-3 text-center font-bold text-black text-sm">
        {hole}
      </td>
      
      {/* Par Input (Editable) */}
      <td className="py-2.5 px-3 text-center">
        <input
          type="number"
          min="3"
          max="5"
          value={par || ''}
          onChange={(e) => {
            const val = parseInt(e.target.value) || 0
            onParChange(Math.max(3, Math.min(5, val)))
          }}
          className="w-12 text-center py-1 border border-grey-light bg-white text-black rounded-[4px] text-xs font-semibold focus:border-green-dark outline-none h-8"
        />
      </td>
      
      {/* Stroke Index Input (Editable) */}
      <td className="py-2.5 px-3 text-center">
        <input
          type="number"
          min="1"
          max="18"
          value={strokeIndex || ''}
          onChange={(e) => {
            const val = parseInt(e.target.value) || 0
            onSiChange(Math.max(1, Math.min(18, val)))
          }}
          className="w-12 text-center py-1 border border-grey-light bg-white text-black rounded-[4px] text-xs focus:border-green-dark outline-none h-8"
        />
      </td>
      
      {/* Shots Input (Editable) */}
      <td className="py-2.5 px-3 text-center">
        <input
          type="number"
          min="0"
          max="15"
          placeholder="-"
          value={shots === 0 ? '0' : (shots || '')}
          onChange={(e) => {
            const val = e.target.value === '' ? '' : parseInt(e.target.value)
            if (val === '') {
              onShotsChange('')
            } else {
              onShotsChange(Math.max(0, Math.min(15, val)))
            }
          }}
          className="w-16 text-center py-1.5 border border-grey-mid/40 bg-white text-black rounded-[4px] text-sm font-bold focus:border-green-dark focus:ring-1 focus:ring-green-dark outline-none h-9"
        />
      </td>

      {/* Allowance display */}
      <td className="py-2.5 px-3 text-center text-xs text-grey-mid font-medium">
        {allowance > 0 ? `+${allowance}` : '-'}
      </td>
      
      {/* Points Display - Live updates */}
      <td className="py-2.5 px-3 text-center">
        <span className={`numeral-mono text-sm font-bold ${points > 0 ? 'text-green-dark' : 'text-grey-mid/60'}`}>
          {points} {points === 1 ? 'pt' : 'pts'}
        </span>
      </td>
    </tr>
  )
}
