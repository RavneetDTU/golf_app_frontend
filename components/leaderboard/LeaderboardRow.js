'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import Badge from '../ui/Badge'

export default function LeaderboardRow({ entry, isCurrentUser, isAdminContext = false }) {
  const router = useRouter()

  // Map rank to medal emojis for top 3
  const getRankIndicator = (rank) => {
    switch (rank) {
      case 1:
        return <span className="text-base" title="1st Place">🥇</span>
      case 2:
        return <span className="text-base" title="2nd Place">🥈</span>
      case 3:
        return <span className="text-base" title="3rd Place">🥉</span>
      default:
        return <span className="text-grey-mid font-medium">{rank}</span>
    }
  }

  // Highlight current user
  let rowBg = isCurrentUser 
    ? 'bg-green-light/45 hover:bg-green-light/60 font-semibold border-l-4 border-green-dark' 
    : 'hover:bg-off-white/80 border-l-4 border-transparent'

  if (isAdminContext) {
    rowBg += ' cursor-pointer'
  }

  const handleRowClick = () => {
    if (isAdminContext) {
      router.push(`/admin/players/${entry.user_id}/scores`)
    }
  }

  return (
    <tr onClick={handleRowClick} className={`border-b border-grey-light transition-colors ${rowBg}`}>
      {/* Rank column */}
      <td className="py-3 px-4 text-center w-12 font-medium">
        {getRankIndicator(entry.rank)}
      </td>
      
      {/* Player name & handicap */}
      <td className="py-3 px-4">
        <div className="flex items-center space-x-2">
          <span className="text-black text-sm block truncate max-w-[150px] sm:max-w-xs">
            {entry.full_name}
            {isCurrentUser && (
              <span className="text-[10px] bg-green-dark text-white font-medium px-1.5 py-0.5 rounded ml-2 uppercase tracking-wide">
                You
              </span>
            )}
          </span>
          <span className="text-[10px] text-grey-mid font-medium hidden sm:inline-block">
            HDCP: {entry.handicap.toFixed(1)}
          </span>
        </div>
      </td>

      {/* Admin Context only Total Shots column */}
      {isAdminContext && (
        <td className="py-3 px-4 text-center">
          <span className="numeral-mono text-sm leading-none font-semibold text-black">
            {entry.total_gross_shots != null ? entry.total_gross_shots : '–'}
          </span>
        </td>
      )}
      
      {/* Points - Monospace Numeral Treatment */}
      <td className="py-3 px-4 text-center">
        <span className="numeral-mono text-sm sm:text-base leading-none font-bold">
          {entry.total_stableford_points}
        </span>
      </td>
      
      {/* Rounds played */}
      <td className="py-3 px-4 text-center text-xs sm:text-sm text-grey-mid">
        {entry.rounds_played}
      </td>
    </tr>
  )
}
