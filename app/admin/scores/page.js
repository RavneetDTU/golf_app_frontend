'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ProtectedRoute from '../../../components/auth/ProtectedRoute'
import PageWrapper from '../../../components/layout/PageWrapper'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Skeleton from '../../../components/ui/Skeleton'
import EmptyState from '../../../components/ui/EmptyState'
import Badge from '../../../components/ui/Badge'
import useAuthStore from '../../../store/useAuthStore'
import { adminListScores, getClubs } from '../../../lib/api'
import { toast } from 'react-hot-toast'
import { ArrowLeft, Plus, Search, Filter, Trash2, Edit } from 'lucide-react'

export default function AdminScoresPage() {
  const router = useRouter()
  const { user, isLoading, initialize } = useAuthStore()

  // State
  const [scores, setScores] = useState([])
  const [clubs, setClubs] = useState([])
  const [selectedClubId, setSelectedClubId] = useState('')
  const [playerSearch, setPlayerSearch] = useState('')
  const [showDeleted, setShowDeleted] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loadingScores, setLoadingScores] = useState(false)
  const [loadingClubs, setLoadingClubs] = useState(false)

  // Auth initialization
  useEffect(() => {
    initialize()
  }, [initialize])

  // Redirect non-admin users
  useEffect(() => {
    if (!isLoading && user && !user.is_admin) {
      router.replace('/dashboard')
    }
  }, [user, isLoading, router])

  // Fetch Clubs once auth is ready
  useEffect(() => {
    if (!user || !user.is_admin) return

    const fetchClubs = async () => {
      setLoadingClubs(true)
      try {
        const response = await getClubs(1)
        const allClubs = response.data?.clubs || []
        setClubs(allClubs)
      } catch (e) {
        console.error('Failed to fetch clubs:', e)
        toast.error('Failed to load clubs filter options.')
      } finally {
        setLoadingClubs(false)
      }
    }
    fetchClubs()
  }, [user])

  // Fetch Scores
  const fetchScores = useCallback(async (pageNum, clubId, isDeletedChecked, append = false) => {
    setLoadingScores(true)
    try {
      const params = {
        page: pageNum,
        per_page: 20,
        include_deleted: isDeletedChecked
      }
      if (clubId) {
        params.club_id = clubId
      }

      const response = await adminListScores(params)
      const data = response.data
      const newScores = data?.scores || data?.items || response.data || []

      if (append) {
        setScores((prev) => [...prev, ...newScores])
      } else {
        setScores(newScores)
      }
      setHasMore(data?.has_more || false)
    } catch (e) {
      console.error('Failed to fetch scores:', e)
      toast.error('Failed to load scores list.')
    } finally {
      setLoadingScores(false)
    }
  }, [])

  // Refetch when filters or toggles change
  useEffect(() => {
    if (!user || !user.is_admin) return
    setPage(1)
    fetchScores(1, selectedClubId, showDeleted, false)
  }, [selectedClubId, showDeleted, user, fetchScores])

  const handleLoadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchScores(nextPage, selectedClubId, showDeleted, true)
  }

  // Formatting Date
  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return dateStr
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  // Client-side search filtering by player name
  const filteredScores = scores.filter((score) => {
    const pName = score.player_name || score.full_name || (score.user && score.user.full_name) || ''
    return pName.toLowerCase().includes(playerSearch.toLowerCase())
  })

  // Loading indicator for validation
  if (isLoading || !user || !user.is_admin) {
    return (
      <PageWrapper className="flex flex-col items-center justify-center min-h-[70vh]">
        <div className="w-12 h-12 bg-green-light rounded-full animate-ping mb-4"></div>
        <p className="text-xs text-grey-mid font-semibold">Validating credentials...</p>
      </PageWrapper>
    )
  }

  return (
    <ProtectedRoute>
      <PageWrapper>
        {/* Back link & Header */}
        <div className="mb-6">
          <Link
            href="/admin"
            className="inline-flex items-center space-x-2 text-sm text-grey-mid hover:text-black transition-colors mb-4 group cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span className="font-medium">Back to Admin Panel</span>
          </Link>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3.5xl font-bold font-display text-green-dark">
                Score Management
              </h1>
              <p className="text-sm text-grey-mid font-medium mt-1">
                View, filter, edit, or soft-delete player scorecards.
              </p>
            </div>
            <Link href="/admin/scores/add">
              <Button
                variant="primary"
                className="text-xs h-10 min-h-0 px-4 font-bold flex items-center gap-1.5 bg-[#2D6A4F] hover:bg-[#1B4332] text-white rounded-[8px]"
              >
                <Plus className="w-4 h-4" />
                <span>Add Score</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Filter Bar */}
        <Card className="p-4 mb-6 border border-grey-light bg-off-white/40 shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            {/* Club Filter */}
            <div className="md:col-span-4">
              <label className="text-[10px] font-bold text-grey-mid uppercase tracking-wider block mb-1">
                Filter by Club
              </label>
              <select
                value={selectedClubId}
                onChange={(e) => setSelectedClubId(e.target.value)}
                className="w-full bg-white text-black border border-grey-light rounded-[8px] px-3.5 py-2 text-xs focus:border-green-dark outline-none h-9"
              >
                <option value="">All Clubs</option>
                {clubs.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Player search */}
            <div className="md:col-span-5">
              <label className="text-[10px] font-bold text-grey-mid uppercase tracking-wider block mb-1">
                Search Player
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-grey-mid" />
                <input
                  type="text"
                  placeholder="Type player name..."
                  value={playerSearch}
                  onChange={(e) => setPlayerSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-grey-light bg-white text-black text-xs rounded-[8px] outline-none focus:border-green-dark h-9"
                />
              </div>
            </div>

            {/* Show Deleted toggle */}
            <div className="md:col-span-3 flex items-center h-full pt-4 md:pt-0 justify-start md:justify-center">
              <label className="relative flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showDeleted}
                  onChange={(e) => setShowDeleted(e.target.checked)}
                  className="w-4 h-4 rounded text-green-dark border-grey-light focus:ring-green-dark focus:ring-0"
                />
                <span className="text-xs font-semibold text-black">
                  Show deleted scores
                </span>
              </label>
            </div>
          </div>
        </Card>

        {/* Scores Table / List */}
        {loadingScores && scores.length === 0 ? (
          <Skeleton variant="rect" className="h-64 w-full rounded-lg" />
        ) : filteredScores.length === 0 ? (
          <EmptyState
            title="No Scores Found"
            description="No player scorecards match the selected filters."
            actionLabel="Add Scorecard"
            onActionClick={() => router.push('/admin/scores/add')}
          />
        ) : (
          <div className="space-y-6">
            <div className="overflow-x-auto border border-grey-light rounded-lg bg-white shadow-xs">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-off-white border-b border-grey-light text-grey-mid uppercase text-[10px] font-bold tracking-wider">
                    <th className="py-3 px-4">Player</th>
                    <th className="py-3 px-4">Club</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Course</th>
                    <th className="py-3 px-4 text-center">Pts</th>
                    <th className="py-3 px-4 text-center">Gross</th>
                    <th className="py-3 px-4 text-center">HCP</th>
                    <th className="py-3 px-4 text-center">Edited</th>
                    <th className="py-3 px-4 text-center w-24">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredScores.map((score) => {
                    const isDeleted = score.deleted_at !== null
                    const playerFullName = score.player_name || score.full_name || (score.user && score.user.full_name) || 'Unknown Player'
                    const showEditIndicator = score.admin_edit_note || score.admin_edited_at || score.admin_edited_by

                    return (
                      <tr
                        key={score.id}
                        className={`border-b border-grey-light hover:bg-off-white/40 transition-colors ${
                          isDeleted ? 'opacity-50 bg-grey-light/20' : ''
                        }`}
                      >
                        {/* Player name */}
                        <td className="py-3 px-4 text-sm font-semibold text-black">
                          {isDeleted ? (
                            <span className="line-through text-grey-mid">
                              {playerFullName}
                            </span>
                          ) : (
                            <span>{playerFullName}</span>
                          )}
                          {isDeleted && (
                            <div className="text-[10px] text-red-500 font-semibold mt-0.5">
                              Deleted: <span className="italic font-normal">{score.delete_note || 'No delete note provided'}</span>
                            </div>
                          )}
                        </td>

                        {/* Club */}
                        <td className="py-3 px-4 text-xs font-semibold text-black">
                          {score.club_name || 'Generic Club'}
                        </td>

                        {/* Date */}
                        <td className="py-3 px-4 text-xs font-medium text-grey-mid">
                          {formatDate(score.played_on)}
                        </td>

                        {/* Course */}
                        <td className="py-3 px-4 text-xs text-grey-mid">
                          {score.course_name || '-'}
                          {score.tee_colour && ` (${score.tee_colour})`}
                        </td>

                        {/* Pts */}
                        <td className="py-3 px-4 text-center text-sm font-bold text-green-dark numeral-mono">
                          {score.stableford_points}
                        </td>

                        {/* Gross */}
                        <td className="py-3 px-4 text-center text-sm font-semibold text-black numeral-mono">
                          {score.gross_shots}
                        </td>

                        {/* HCP */}
                        <td className="py-3 px-4 text-center text-xs font-semibold text-black numeral-mono">
                          {parseFloat(score.handicap_used || 0).toFixed(1)}
                        </td>

                        {/* Edited Indicator */}
                        <td className="py-3 px-4 text-center text-sm">
                          {showEditIndicator ? (
                            <span
                              title={score.admin_edit_note || 'Edited by admin'}
                              className="inline-block cursor-help select-none"
                            >
                              ✏️
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-center">
                          {isDeleted ? (
                            <Badge variant="neutral">Deleted</Badge>
                          ) : (
                            <div className="flex justify-center space-x-1.5">
                              <Link href={`/admin/scores/${score.id}/edit`}>
                                <button
                                  className="p-1.5 rounded-full hover:bg-off-white text-grey-mid hover:text-green-dark transition-colors cursor-pointer"
                                  title="Edit Score"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                              </Link>
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Load more pagination */}
            {hasMore && !loadingScores && (
              <div className="flex justify-center pt-2">
                <Button
                  variant="secondary"
                  onClick={handleLoadMore}
                  className="text-xs h-9 min-h-[36px] px-4"
                >
                  Load More Scores
                </Button>
              </div>
            )}
            
            {loadingScores && (
              <div className="flex justify-center py-2">
                <div className="w-6 h-6 border-2 border-green-dark border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
        )}
      </PageWrapper>
    </ProtectedRoute>
  )
}
