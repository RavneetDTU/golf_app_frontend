'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '../../../../components/auth/ProtectedRoute'
import PageWrapper from '../../../../components/layout/PageWrapper'
import LeaderboardTable from '../../../../components/leaderboard/LeaderboardTable'
import Button from '../../../../components/ui/Button'
import Card from '../../../../components/ui/Card'
import Badge from '../../../../components/ui/Badge'
import Skeleton from '../../../../components/ui/Skeleton'
import EmptyState from '../../../../components/ui/EmptyState'
import { getLeaderboard, getMyRank, getClub } from '../../../../lib/api'
import { ArrowLeft, RefreshCw, Trophy, Calendar } from 'lucide-react'

export default function LeaderboardPage({ params }) {
  const router = useRouter()
  const clubId = params.clubId

  // Leaderboard data states
  const [clubName, setClubName] = useState('Golf Club')
  const [leaderboardEntries, setLeaderboardEntries] = useState([])
  const [myRankData, setMyRankData] = useState(null)
  const [hasMyRank, setHasMyRank] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)

  const fetchLeaderboardData = useCallback(async (pageNum, append = false) => {
    if (pageNum === 1) {
      setLoading(true)
    } else {
      setLoadingMore(true)
    }

    try {
      // 1. Fetch club info and leaderboard in parallel
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

      // 2. Fetch current user rank (only on first load)
      if (pageNum === 1) {
        try {
          const rankRes = await getMyRank(clubId)
          setMyRankData(rankRes.data)
          setHasMyRank(true)
        } catch (rankErr) {
          // 404 means user hasn't submitted a score in this club yet
          setMyRankData(null)
          setHasMyRank(false)
        }
      }
    } catch (e) {
      console.error('Failed to load leaderboard data:', e)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [clubId])

  useEffect(() => {
    fetchLeaderboardData(1, false)
  }, [fetchLeaderboardData])

  const handleLoadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchLeaderboardData(nextPage, true)
  }

  return (
    <ProtectedRoute>
      <PageWrapper>
        {/* Navigation & Header */}
        <div className="mb-6">
          <Link
            href="/clubs"
            className="inline-flex items-center space-x-2 text-sm text-grey-mid hover:text-black transition-colors mb-4 group cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span className="font-medium">Back to Clubs</span>
          </Link>
          
          <h1 className="text-2xl md:text-3.5xl font-bold font-display text-green-dark">
            {clubName}
          </h1>
          <p className="text-sm text-grey-mid font-medium mt-1">
            All-time Club Leaderboard
          </p>
        </div>

        {/* User Rank Status Banner */}
        {!loading && (
          <div className="mb-6">
            {hasMyRank && myRankData ? (
              <Card className="bg-green-light/25 border-green-mid/20 flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-green-dark text-white font-bold flex items-center justify-center">
                    #{myRankData.rank}
                  </div>
                  <div>
                    <p className="font-bold text-black text-sm sm:text-base">
                      Your rank: #{myRankData.rank}
                    </p>
                    <p className="text-xs text-grey-mid">
                      Across all verified scorecards in this club
                    </p>
                  </div>
                </div>
                
                <div className="text-right flex sm:flex-col items-baseline sm:items-end gap-1.5 sm:gap-0">
                  <span className="numeral-mono text-base sm:text-lg font-bold">
                    {myRankData.total_stableford_points}
                  </span>
                  <span className="text-[10px] text-grey-mid font-semibold uppercase tracking-wider">
                    Total Points ({myRankData.rounds_played} rds)
                  </span>
                </div>
              </Card>
            ) : (
              <Card className="bg-off-white border-grey-light p-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <p className="font-bold text-black text-sm">
                      You are not ranked yet
                    </p>
                    <p className="text-xs text-grey-mid mt-0.5">
                      Submit your first scorecard for {clubName} to join the leaderboard!
                    </p>
                  </div>
                  
                  <Link href="/scores/new">
                    <Button variant="primary" className="min-h-0 h-9 text-xs py-0 px-4">
                      Submit Score
                    </Button>
                  </Link>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Leaderboard Table Content */}
        {loading ? (
          <div className="space-y-4">
            <Skeleton variant="rect" className="h-10 w-full rounded" />
            <Skeleton variant="rect" className="h-64 w-full rounded-lg" />
          </div>
        ) : leaderboardEntries.length === 0 ? (
          <EmptyState
            title="Leaderboard Empty"
            description="No members have submitted scorecards for this club yet. Be the first to record a round!"
            actionLabel="Post Score"
            onActionClick={() => router.push('/scores/new')}
          />
        ) : (
          <div className="space-y-6">
            <LeaderboardTable entries={leaderboardEntries} />

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
