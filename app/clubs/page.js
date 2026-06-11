'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import ProtectedRoute from '../../components/auth/ProtectedRoute'
import PageWrapper from '../../components/layout/PageWrapper'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Skeleton from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import { getClubs, joinClub, leaveClub } from '../../lib/api'
import { toast } from 'react-hot-toast'
import { MapPin, Users, Check, Search } from 'lucide-react'

export default function ClubsPage() {
  const [clubs, setClubs] = useState([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const fetchClubs = async (pageNum, append = false) => {
    if (pageNum === 1) {
      setLoading(true)
    } else {
      setLoadingMore(true)
    }

    try {
      const response = await getClubs(pageNum)
      const data = response.data
      
      const newClubs = data?.clubs || []
      
      if (append) {
        setClubs((prev) => [...prev, ...newClubs])
      } else {
        setClubs(newClubs)
      }
      
      setTotal(data?.total || 0)
      setHasMore(data?.has_more || false)
    } catch (e) {
      console.error('Failed to load clubs:', e)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    fetchClubs(1, false)
  }, [])

  const handleJoinClub = async (clubId) => {
    // Optimistic Update: toggle member status in UI instantly
    const previousClubsState = [...clubs]
    
    setClubs((prevClubs) =>
      prevClubs.map((club) => {
        if (club.id === clubId) {
          return {
            ...club,
            is_member: true,
            member_count: club.member_count + 1
          }
        }
        return club
      })
    )

    try {
      await joinClub(clubId)
      toast.success('Joined club successfully!')
    } catch (error) {
      console.error('Failed to join club:', error)
      // Rollback on error
      setClubs(previousClubsState)
      const message = error.response?.data?.detail || 'Failed to join club.'
      toast.error(message)
    }
  }

  const handleLeaveClub = async (clubId) => {
    // Optimistic Update: toggle member status in UI instantly
    const previousClubsState = [...clubs]
    
    setClubs((prevClubs) =>
      prevClubs.map((club) => {
        if (club.id === clubId) {
          return {
            ...club,
            is_member: false,
            member_count: Math.max(0, club.member_count - 1)
          }
        }
        return club
      })
    )

    try {
      await leaveClub(clubId)
      toast.success('Left club successfully.')
    } catch (error) {
      console.error('Failed to leave club:', error)
      // Rollback on error
      setClubs(previousClubsState)
      const message = error.response?.data?.detail || 'Failed to leave club.'
      toast.error(message)
    }
  }

  const handleLoadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchClubs(nextPage, true)
  }

  // Filter clubs locally based on search input
  const filteredClubs = clubs.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.location && c.location.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <ProtectedRoute>
      <PageWrapper>
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3.5xl font-bold font-display text-green-dark">
              Golf Clubs
            </h1>
            <p className="text-sm text-grey-mid font-medium mt-1">
              Browse golf clubs, view leaderboards, and join to track your rank.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-grey-mid" />
            <input
              type="text"
              placeholder="Search clubs or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-grey-light bg-white text-black text-sm rounded-[8px] outline-none focus:border-green-dark focus:ring-1 focus:ring-green-dark h-10"
            />
          </div>
        </div>

        {/* Loading Skeletons */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton variant="rect" className="h-32 rounded-lg" />
            <Skeleton variant="rect" className="h-32 rounded-lg" />
            <Skeleton variant="rect" className="h-32 rounded-lg" />
            <Skeleton variant="rect" className="h-32 rounded-lg" />
          </div>
        ) : filteredClubs.length === 0 ? (
          <EmptyState
            title="No Clubs Found"
            description={searchQuery ? `No active clubs match "${searchQuery}".` : "There are currently no active clubs registered in the system."}
          />
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredClubs.map((club) => (
                <Card key={club.id} className="flex flex-col justify-between hover:shadow-md transition-shadow relative">
                  <div>
                    {/* Club Header Info */}
                    <div className="flex justify-between items-start gap-4 mb-2">
                      <Link href={`/clubs/${club.id}/leaderboard`} className="hover:underline">
                        <h2 className="text-base font-bold text-black cursor-pointer">
                          {club.name}
                        </h2>
                      </Link>
                      
                      {club.is_member && (
                        <Badge variant="success" className="flex items-center gap-1.5 whitespace-nowrap">
                          <Check className="w-3.5 h-3.5" />
                          <span>Joined ✓</span>
                        </Badge>
                      )}
                    </div>

                    {/* Location & Members counts */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-grey-mid font-medium mb-3">
                      {club.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{club.location}</span>
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        <span>{club.member_count} {club.member_count === 1 ? 'member' : 'members'}</span>
                      </span>
                    </div>

                    {club.description && (
                      <p className="text-xs text-grey-mid line-clamp-2 leading-relaxed mb-4">
                        {club.description}
                      </p>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="flex gap-3 pt-3 border-t border-grey-light mt-auto">
                    <Link href={`/clubs/${club.id}/leaderboard`} className="flex-1">
                      <Button variant="outline" className="w-full h-9 min-h-[36px] text-xs">
                        Leaderboard
                      </Button>
                    </Link>
                    
                    {club.is_member ? (
                      <Button
                        variant="danger"
                        onClick={() => handleLeaveClub(club.id)}
                        className="flex-1 h-9 min-h-[36px] text-xs"
                      >
                        Leave Club
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        onClick={() => handleJoinClub(club.id)}
                        className="flex-1 h-9 min-h-[36px] text-xs"
                      >
                        Join Club
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>

            {/* Pagination Controls */}
            {hasMore && (
              <div className="flex justify-center pt-6">
                <Button
                  variant="secondary"
                  loading={loadingMore}
                  onClick={handleLoadMore}
                  className="px-6 py-2 h-10 text-xs"
                >
                  Load More Clubs
                </Button>
              </div>
            )}
          </div>
        )}
      </PageWrapper>
    </ProtectedRoute>
  )
}
