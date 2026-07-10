'use client'

import React from 'react'
import Link from 'next/link'
import { Settings, Trophy } from 'lucide-react'

export default function AdminClubRow({ club, onEdit }) {
  const { name, location, member_count, is_active } = club

  return (
    <tr className="border-b border-grey-light hover:bg-off-white/40 transition-colors">
      <td className="py-3 px-4 font-semibold text-black text-sm">
        {name}
      </td>
      <td className="py-3 px-4 text-grey-mid text-sm truncate max-w-[200px]" title={location || 'No Location'}>
        {location || '-'}
      </td>
      <td className="py-3 px-4 text-center font-bold numeral-mono text-sm">
        {member_count || 0}
      </td>
      <td className="py-3 px-4 text-center">
        {is_active !== false ? (
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#D8F3DC] border border-[#2D6A4F]/25" title="Active"></span>
        ) : (
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-soft/20 border border-red-soft/45" title="Inactive"></span>
        )}
      </td>
      <td className="py-3 px-4 text-center">
        <div className="flex justify-center space-x-1.5">
          <Link href={`/admin/clubs/${club.id}/leaderboard`}>
            <button
              className="p-1.5 rounded-full hover:bg-off-white text-grey-mid hover:text-green-dark transition-colors cursor-pointer"
              title="View Leaderboard"
            >
              <Trophy className="w-4 h-4" />
            </button>
          </Link>
          <button
            onClick={() => onEdit(club)}
            className="p-1.5 rounded-full hover:bg-off-white text-grey-mid hover:text-green-dark transition-colors cursor-pointer"
            title="Edit Club Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  )
}
