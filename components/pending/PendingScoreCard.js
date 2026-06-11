'use client'

import React, { useState } from 'react'
import Card from '../ui/Card'
import PendingActions from './PendingActions'
import { Calendar, User, ChevronDown, ChevronUp, BarChart2 } from 'lucide-react'

export default function PendingScoreCard({
  pendingScore,
  onApprove,
  onReject,
  onEditSubmit,
  isLoading,
  actionType
}) {
  const [expanded, setExpanded] = useState(false)

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

  const {
    id,
    submitted_by_name,
    club_name,
    played_on,
    course_name,
    tee_colour,
    gross_shots,
    stableford_points,
    hole_scores = []
  } = pendingScore

  return (
    <Card className="hover:shadow-md transition-shadow duration-200 border border-grey-light bg-white p-5 space-y-4">
      {/* Top Header Row */}
      <div className="flex justify-between items-start gap-4">
        <div className="space-y-1.5 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-grey-mid font-medium">
            <span className="flex items-center gap-1">
              <User className="w-3.5 h-3.5" />
              <span>By: {submitted_by_name || 'Another player'}</span>
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formatDate(played_on)}</span>
            </span>
          </div>
          <h3 className="text-base font-bold text-black">{club_name || 'Golf Club'}</h3>
          {course_name && (
            <p className="text-xs text-grey-mid">
              Course: {course_name} {tee_colour ? `(${tee_colour} Tee)` : ''}
            </p>
          )}
        </div>

        {/* Aggregated Totals */}
        <div className="text-right">
          <p className="numeral-mono text-lg leading-none font-bold">
            {stableford_points} <span className="text-xs font-semibold text-grey-mid uppercase tracking-wide">pts</span>
          </p>
          <p className="text-xs text-grey-mid mt-1 font-semibold">{gross_shots} shots</p>
        </div>
      </div>

      {/* Expand / Collapse Button */}
      <div className="pt-2">
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs font-bold text-green-dark hover:text-green-mid flex items-center space-x-1 transition-colors cursor-pointer"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          <span>{expanded ? 'Hide Holes' : 'View Holes'}</span>
        </button>
      </div>

      {/* Expanded Holes Table */}
      {expanded && (
        <div className="overflow-x-auto border border-grey-light rounded-lg bg-off-white/30 animate-fade-in">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-off-white border-b border-grey-light text-grey-mid uppercase font-semibold text-[10px] tracking-wider">
                <th className="py-2 px-3 text-center">Hole</th>
                <th className="py-2 px-3 text-center">Par</th>
                <th className="py-2 px-3 text-center">SI</th>
                <th className="py-2 px-3 text-center">Shots</th>
              </tr>
            </thead>
            <tbody>
              {hole_scores.map((h) => (
                <tr key={h.hole} className="border-b border-grey-light hover:bg-off-white/40">
                  <td className="py-2 px-3 text-center font-bold text-black">{h.hole}</td>
                  <td className="py-2 px-3 text-center text-grey-mid">{h.par}</td>
                  <td className="py-2 px-3 text-center text-grey-mid">{h.stroke_index || h.strokeIndex}</td>
                  <td className="py-2 px-3 text-center font-semibold text-black">{h.shots || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Divider */}
      <div className="border-t border-grey-light pt-4">
        {/* Actions panel */}
        <PendingActions
          isLoading={isLoading}
          actionType={actionType}
          onApprove={() => onApprove(id)}
          onReject={() => onReject(id)}
          onEditSubmit={() => onEditSubmit(pendingScore)}
        />
      </div>
    </Card>
  )
}
