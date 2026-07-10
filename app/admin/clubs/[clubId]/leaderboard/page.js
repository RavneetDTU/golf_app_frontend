'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '../../../../../components/auth/ProtectedRoute'
import PageWrapper from '../../../../../components/layout/PageWrapper'
import LeaderboardTable from '../../../../../components/leaderboard/LeaderboardTable'
import Button from '../../../../../components/ui/Button'
import Card from '../../../../../components/ui/Card'
import Skeleton from '../../../../../components/ui/Skeleton'
import EmptyState from '../../../../../components/ui/EmptyState'
import { getLeaderboard, getClub } from '../../../../../lib/api'
import useAuthStore from '../../../../../store/useAuthStore'
import { ArrowLeft, Trophy } from 'lucide-react'

export default function AdminClubLeaderboardPage({ params }) {
  const router = useRouter()
  const { user, isLoading, initialize } = useAuthStore()
  const clubId = params.clubId

  // Leaderboard data states
  const [clubName, setClubName] = useState('Golf Club')
  const [leaderboardEntries, setLeaderboardEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)

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

  const fetchLeaderboardData = useCallback(async (pageNum, append = false) => {
    if (pageNum === 1) {
      setLoading(true)
    } else {
      setLoadingMore(true)
    }

    try {
      const [leaderboardRes, clubRes] = await Promise.all([
        getLeaderboard(clubId, pageNum),
        getClub(clubId)
      ])

      const lData = leaderboardRes.data
      setClubName(clubRes.data?.name || lData?.club_name || 'Golf Club')
      
      const newEntries = lData?.entries || []
      if (append) {
        setLeaderboardEntries((prev) => [...prev, ...newEntries])
      } else {
        setLeaderboardEntries(newEntries)
      }
      
      setHasMore(lData?.has_more || false)
    } catch (e) {
      console.error('Failed to load admin leaderboard data:', e)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [clubId])

  useEffect(() => {
    if (user && user.is_admin) {
      fetchLeaderboardData(1, false)
    }
  }, [user, fetchLeaderboardData])

  const handleLoadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchLeaderboardData(nextPage, true)
  }

  // Loading indicator for credentials validation
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
        {/* Navigation & Header */}
        <div className="mb-6">
          <Link
            href="/admin"
            className="inline-flex items-center space-x-2 text-sm text-grey-mid hover:text-black transition-colors mb-4 group cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span className="font-medium">Back to Admin Panel</span>
          </Link>
          
          <h1 className="text-2xl md:text-3.5xl font-bold font-display text-green-dark">
            {clubName} (Admin)
          </h1>
          <p className="text-sm text-grey-mid font-medium mt-1">
            All-time Club Leaderboard (Click player row to see scorecards)
          </p>
        </div>

        {/* Leaderboard Table Content */}
        {loading ? (
          <div className="space-y-4">
            <Skeleton variant="rect" className="h-10 w-full rounded" />
            <Skeleton variant="rect" className="h-64 w-full rounded-lg" />
          </div>
        ) : leaderboardEntries.length === 0 ? (
          <EmptyState
            title="Leaderboard Empty"
            description="No members have submitted scorecards for this club yet."
          />
        ) : (
          <div className="space-y-6">
            <LeaderboardTable entries={leaderboardEntries} isAdminContext={true} />

            {/* Load More Pagination */}
            {hasMore && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="secondary"
                  loading={loadingMore}
                  onClick={handleLoadMore}
                  className="px-6 py-2 h-10 text-xs"
                >
                  Load More Players
                </Button>
              </div>
            )}
          </div>
        )}
      </PageWrapper>
    </ProtectedRoute>
  )
}
