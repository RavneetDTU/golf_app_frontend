'use client'

import React from 'react'
import Card from '../ui/Card'

export default function AdminStatsBar({ stats = {} }) {
  const statItems = [
    { label: 'Users', value: stats.total_users || stats.totalUsers || 0 },
    { label: 'Clubs', value: stats.total_clubs || stats.totalClubs || 0 },
    { label: 'Scores', value: stats.total_scores || stats.totalScores || 0 },
    { label: 'Disputes', value: stats.total_disputes || stats.totalDisputes || 0 },
    { label: 'Open Disputes', value: stats.open_disputes || stats.openDisputes || 0 },
    { label: 'Pending Scores', value: stats.pending_scores || stats.pendingScores || 0 }
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 w-full mb-8">
      {statItems.map((item, i) => (
        <Card key={i} className="flex flex-col justify-between items-center text-center p-4 border border-grey-light bg-off-white/30 shadow-xs">
          <p className="text-[10px] font-bold text-grey-mid uppercase tracking-wider mb-1">
            {item.label}
          </p>
          <p className="text-xl md:text-2xl font-bold numeral-mono text-green-dark">
            {item.value}
          </p>
        </Card>
      ))}
    </div>
  )
}
