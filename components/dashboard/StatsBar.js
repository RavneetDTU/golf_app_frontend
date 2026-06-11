'use client'

import React from 'react'
import Card from '../ui/Card'

export default function StatsBar({ totalPoints = 0, roundsPlayed = 0, handicap = 0.0 }) {
  const stats = [
    { label: 'Total Points', value: totalPoints, suffix: ' pts' },
    { label: 'Rounds Played', value: roundsPlayed, suffix: ' rds' },
    { label: 'Handicap', value: typeof handicap === 'number' ? handicap.toFixed(1) : parseFloat(handicap || 0).toFixed(1), suffix: '' }
  ]

  return (
    <div className="grid grid-cols-3 gap-3 md:gap-6 w-full my-6">
      {stats.map((stat, i) => (
        <Card key={i} className="flex flex-col justify-between items-center text-center p-3 md:p-5 border border-grey-light bg-off-white/30">
          <p className="text-[10px] md:text-xs font-semibold text-grey-mid uppercase tracking-wider mb-1">
            {stat.label}
          </p>
          <p className="text-lg md:text-2xl font-bold numeral-mono text-green-dark">
            {stat.value}
            {stat.suffix && (
              <span className="text-[10px] md:text-xs font-semibold text-grey-mid uppercase lowercase tracking-normal font-sans ml-0.5">
                {stat.suffix}
              </span>
            )}
          </p>
        </Card>
      ))}
    </div>
  )
}
