'use client'

import React from 'react'
import LeaderboardRow from './LeaderboardRow'
import useAuthStore from '../../store/useAuthStore'

export default function LeaderboardTable({ entries = [], isAdminContext = false }) {
  const { user } = useAuthStore()

  return (
    <div className="w-full overflow-x-auto border border-grey-light rounded-lg bg-white shadow-xs">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-off-white border-b border-grey-light text-grey-mid uppercase text-[10px] font-bold tracking-wider">
            <th className="py-3 px-4 text-center w-12">#</th>
            <th className="py-3 px-4">Player</th>
            {isAdminContext && <th className="py-3 px-4 text-center w-24">Shots</th>}
            <th className="py-3 px-4 text-center w-20">Pts</th>
            <th className="py-3 px-4 text-center w-24">Rounds</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <LeaderboardRow
              key={entry.user_id}
              entry={entry}
              isCurrentUser={user?.id === entry.user_id}
              isAdminContext={isAdminContext}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}
