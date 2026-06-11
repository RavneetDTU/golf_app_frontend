'use client'

import React from 'react'
import Card from '../ui/Card'
import { Calendar, Target } from 'lucide-react'

export default function ScoreCard({ score, onDetailsClick }) {
  // Format Date: e.g., '10 Jun 2026'
  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('en-ZA', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    } catch (e) {
      return dateStr
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <div className="flex items-center text-xs text-grey-mid space-x-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formatDate(score.playedOn || score.played_on || score.date)}</span>
          </div>
          <h4 className="text-base font-bold text-black">
            {score.clubName || score.club_name || 'Golf Club'}
          </h4>
          {score.courseName && (
            <p className="text-xs text-grey-mid">Course: {score.courseName}</p>
          )}
        </div>
        
        {/* Monospace numeral treatment for score points */}
        <div className="text-right">
          <p className="numeral-mono font-bold text-lg leading-none">
            {score.points} <span className="text-xs font-semibold text-grey-mid uppercase tracking-wide">pts</span>
          </p>
          <p className="text-xs text-grey-mid mt-1 font-medium">
            {score.shots || score.gross_shots} shots
          </p>
        </div>
      </div>
      
      {onDetailsClick && (
        <div className="mt-3 pt-3 border-t border-grey-light flex justify-end">
          <button
            onClick={onDetailsClick}
            className="text-xs font-semibold text-green-dark hover:text-green-mid flex items-center space-x-1 cursor-pointer"
          >
            <Target className="w-3.5 h-3.5" />
            <span>Details</span>
          </button>
        </div>
      )}
    </Card>
  )
}
