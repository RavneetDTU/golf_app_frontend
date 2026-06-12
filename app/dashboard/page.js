'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import ProtectedRoute from '../../components/auth/ProtectedRoute'
import PageWrapper from '../../components/layout/PageWrapper'
import ScoreCard from '../../components/dashboard/ScoreCard'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Skeleton from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import Button from '../../components/ui/Button'
import useAuthStore from '../../store/useAuthStore'
import { getClubs, getMyRank, getMyScores, updateProfile } from '../../lib/api'
import { Trophy, Plus, PlusCircle, ArrowRight, X, Pencil } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function DashboardPage() {
  const { user, initialize } = useAuthStore()
  
  // Dashboard states
  const [clubsList, setClubsList] = useState([])
  const [joinedClubs, setJoinedClubs] = useState([])
  const [loading, setLoading] = useState(true)
  const [greeting, setGreeting] = useState('Welcome')

  // Handicap editing states
  const [isEditingHandicap, setIsEditingHandicap] = useState(false)
  const [handicapInput, setHandicapInput] = useState('')
  const [handicapError, setHandicapError] = useState('')
  
  // Recent scores pagination
  const [recentScores, setRecentScores] = useState([])
  const [scoresPage, setScoresPage] = useState(1)
  const [hasMoreScores, setHasMoreScores] = useState(false)
  const [loadingScores, setLoadingScores] = useState(false)
  
  // Score details modal
  const [selectedScore, setSelectedScore] = useState(null)
  
  // Aggregated Stats
  const [stats, setStats] = useState({
    totalPoints: 0,
    roundsPlayed: 0
  })

  const handleHandicapChange = (val) => {
    setHandicapInput(val)
    if (val === '') {
      setHandicapError('Handicap is required')
    } else {
      const parsed = parseFloat(val)
      if (isNaN(parsed) || parsed < 0 || parsed > 54) {
        setHandicapError('Handicap must be between 0 and 54')
      } else {
        setHandicapError('')
      }
    }
  }

  const handleSaveHandicap = async () => {
    if (handicapInput === '') {
      setHandicapError('Handicap is required')
      return
    }
    const parsedValue = parseFloat(handicapInput)
    if (isNaN(parsedValue) || parsedValue < 0 || parsedValue > 54) {
      setHandicapError('Handicap must be between 0 and 54')
      return
    }

    try {
      const response = await updateProfile({ handicap: parsedValue })
      useAuthStore.getState().updateUser(response.data)
      setIsEditingHandicap(false)
      toast.success(`Handicap updated to ${parsedValue.toFixed(1)}`)
    } catch (e) {
      console.error('Failed to update handicap:', e)
      toast.error('Failed to update handicap. Please try again.')
    }
  }

  // Initialize Auth
  useEffect(() => {
    initialize()
  }, [initialize])

  // Determine greeting by time of day
  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) {
      setGreeting('Good morning')
    } else if (hour < 17) {
      setGreeting('Good afternoon')
    } else {
      setGreeting('Good evening')
    }
  }, [])

  // Fetch paginated user scores from API
  const fetchScores = useCallback(async (pageNum, append = false) => {
    if (!user) return
    setLoadingScores(true)
    try {
      const response = await getMyScores(pageNum)
      const data = response.data
      const newScoresRaw = data?.scores || []

      // Map backend fields to standard frontend scorecard schema
      const formattedScores = newScoresRaw.map((score) => ({
        id: score.id,
        gameId: score.game_id,
        clubName: score.club_name,
        playedOn: score.played_on,
        courseName: score.course_name,
        teeColour: score.tee_colour,
        points: score.stableford_points,
        shots: score.gross_shots,
        handicapUsed: score.handicap_used,
        holeScores: score.hole_scores,
        date: score.played_on
      }))

      if (append) {
        setRecentScores((prev) => [...prev, ...formattedScores])
      } else {
        setRecentScores(formattedScores)
      }

      setHasMoreScores(data?.has_more || false)
    } catch (e) {
      console.error('Failed to load recent scores:', e)
    } finally {
      setLoadingScores(false)
    }
  }, [user])

  const handleLoadMoreScores = () => {
    const nextPage = scoresPage + 1
    setScoresPage(nextPage)
    fetchScores(nextPage, true)
  }

  // Fetch user clubs and query rank for each joined club
  const fetchDashboardData = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      // 1. Fetch clubs list
      const response = await getClubs(1)
      const allClubs = response.data?.clubs || []
      setClubsList(allClubs)
      
      const memberClubs = allClubs.filter(c => c.is_member)
      
      // 2. Fetch ranking/rounds details for each club in parallel
      const clubDetailsProms = memberClubs.map(async (club) => {
        try {
          const rankRes = await getMyRank(club.id)
          return {
            ...club,
            rank: rankRes.data.rank,
            points: rankRes.data.total_stableford_points,
            rounds: rankRes.data.rounds_played
          }
        } catch (e) {
          // If no scores submitted yet, user has no rank entry in leaderboard
          return {
            ...club,
            rank: null,
            points: 0,
            rounds: 0
          }
        }
      })
      
      const enrichedClubs = await Promise.all(clubDetailsProms)
      setJoinedClubs(enrichedClubs)
      
      // 3. Aggregate total points and rounds
      const totalPoints = enrichedClubs.reduce((acc, c) => acc + c.points, 0)
      const roundsPlayed = enrichedClubs.reduce((acc, c) => acc + c.rounds, 0)
      setStats({ totalPoints, roundsPlayed })
      
      // 4. Fetch recent scores from API
      await fetchScores(1, false)

    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }, [user, fetchScores])

  useEffect(() => {
    if (user) {
      fetchDashboardData()
    }
  }, [user, fetchDashboardData])

  return (
    <ProtectedRoute>
      <PageWrapper>
        {/* Header Greeting */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3.5xl font-bold font-display text-green-dark flex items-center gap-2">
            {greeting}, {user?.name || 'Golfer'} {new Date().getHours() < 12 ? '☀️' : new Date().getHours() < 17 ? '🌤️' : '🌙'}
          </h1>
          <p className="text-sm text-grey-mid font-medium">Ready for your next round?</p>
        </div>

        {/* Stats Bar (Inlined and Handicap is Editable) */}
        <div className="grid grid-cols-3 gap-3 md:gap-6 w-full my-6">
          {/* Total Points */}
          <Card className="flex flex-col justify-between items-center text-center p-3 md:p-5 border border-grey-light bg-off-white/30">
            <p className="text-[10px] md:text-xs font-semibold text-grey-mid uppercase tracking-wider mb-1">
              Total Points
            </p>
            <p className="text-lg md:text-2xl font-bold numeral-mono text-green-dark mt-0.5">
              {stats.totalPoints}
              <span className="text-[10px] md:text-xs font-semibold text-grey-mid uppercase lowercase tracking-normal font-sans ml-0.5">
                {' pts'}
              </span>
            </p>
          </Card>

          {/* Rounds Played */}
          <Card className="flex flex-col justify-between items-center text-center p-3 md:p-5 border border-grey-light bg-off-white/30">
            <p className="text-[10px] md:text-xs font-semibold text-grey-mid uppercase tracking-wider mb-1">
              Rounds Played
            </p>
            <p className="text-lg md:text-2xl font-bold numeral-mono text-green-dark mt-0.5">
              {stats.roundsPlayed}
              <span className="text-[10px] md:text-xs font-semibold text-grey-mid uppercase lowercase tracking-normal font-sans ml-0.5">
                {' rds'}
              </span>
            </p>
          </Card>

          {/* Handicap Stat Card (Editable) */}
          <Card className="flex flex-col justify-between items-center text-center p-3 md:p-5 border border-grey-light bg-off-white/30 relative">
            {!isEditingHandicap ? (
              <div className="flex flex-col justify-between items-center h-full w-full">
                <p className="text-[10px] md:text-xs font-semibold text-grey-mid uppercase tracking-wider mb-1">
                  Handicap
                </p>
                <div className="flex items-center justify-center gap-1.5 mt-0.5">
                  <p className="text-lg md:text-2xl font-bold numeral-mono text-green-dark">
                    {(typeof user?.handicap === 'number' ? user.handicap : parseFloat(user?.handicap || 0)).toFixed(1)}
                  </p>
                  <button
                    onClick={() => {
                      setIsEditingHandicap(true)
                      setHandicapInput((user?.handicap || 0.0).toString())
                      setHandicapError('')
                    }}
                    className="p-1 hover:bg-grey-light/40 rounded transition-colors text-grey-mid hover:text-black cursor-pointer flex items-center justify-center"
                    title="Edit Handicap"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="w-full flex flex-col items-center justify-between h-full">
                <p className="text-[10px] md:text-xs font-semibold text-grey-mid uppercase tracking-wider">
                  Update Handicap
                </p>
                <input
                  type="number"
                  min={0}
                  max={54}
                  step={0.1}
                  value={handicapInput}
                  onChange={(e) => handleHandicapChange(e.target.value)}
                  className="w-20 text-center bg-white text-black border border-grey-light rounded px-2 py-1 text-sm focus:border-green-dark focus:ring-1 focus:ring-green-dark outline-none h-8 my-1"
                />
                {handicapError && (
                  <span className="text-[10px] text-red-soft block mb-1">
                    {handicapError}
                  </span>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingHandicap(false)
                      setHandicapInput((user?.handicap || 0.0).toString())
                      setHandicapError('')
                    }}
                    className="h-7 px-2 text-[10px] font-semibold text-black bg-off-white hover:bg-grey-light border border-grey-light rounded-[4px] transition-colors cursor-pointer flex items-center justify-center"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveHandicap}
                    className="h-7 px-2 text-[10px] font-semibold text-white bg-green-dark hover:bg-green-mid rounded-[4px] transition-colors cursor-pointer flex items-center justify-center"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
          {/* Left Column: My Clubs */}
          <div className="lg:col-span-5 space-y-6">
            <div className="flex justify-between items-center border-b border-grey-light pb-3">
              <h3 className="text-lg font-bold text-black flex items-center gap-1.5">
                <Trophy className="w-5 h-5 text-green-dark" />
                <span>My Clubs</span>
              </h3>
              <Link
                href="/clubs"
                className="w-8 h-8 rounded-full border border-grey-light hover:border-green-dark hover:bg-green-light/20 flex items-center justify-center text-green-dark transition-all cursor-pointer"
                title="Browse and Join Clubs"
              >
                <Plus className="w-4 h-4" />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                <Skeleton variant="rect" className="h-20 rounded-lg" />
                <Skeleton variant="rect" className="h-20 rounded-lg" />
              </div>
            ) : joinedClubs.length === 0 ? (
              <EmptyState
                title="No Clubs Joined"
                description="Join a golf club to start tracking your ranking and compare scores on leaderboards."
                actionLabel="Browse Clubs"
                onActionClick={() => (window.location.href = '/clubs')}
              />
            ) : (
              <div className="space-y-3">
                {joinedClubs.map((club) => (
                  <Card key={club.id} className="hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-bold text-black text-sm">{club.name}</h4>
                        <p className="text-xs text-grey-mid mt-0.5">
                          {club.points} pts · {club.rounds} rounds
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        {club.rank ? (
                          <Badge variant={club.rank === 1 ? 'rank1' : 'success'}>
                            Rank #{club.rank}
                          </Badge>
                        ) : (
                          <Badge variant="neutral">Unranked</Badge>
                        )}
                        
                        <Link href={`/clubs/${club.id}/leaderboard`}>
                          <Button variant="outline" className="min-h-0 h-8 text-xs py-0 px-3">
                            View
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Recent Scores */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex justify-between items-center border-b border-grey-light pb-3">
              <h3 className="text-lg font-bold text-black">Recent Scores</h3>
              <Link href="/scores/new">
                <Button variant="text" className="text-xs font-semibold py-1 px-2 flex items-center gap-1">
                  <PlusCircle className="w-4 h-4" />
                  <span>Add New</span>
                </Button>
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                <Skeleton variant="rect" className="h-24 rounded-lg" />
                <Skeleton variant="rect" className="h-24 rounded-lg" />
              </div>
            ) : recentScores.length === 0 ? (
              <EmptyState
                title="No Scores Submitted"
                description="You haven&apos;t submitted any game scores yet. Post your scorecard to see your points."
                actionLabel="Add Score"
                onActionClick={() => (window.location.href = '/scores/new')}
              />
            ) : (
              <div className="space-y-3">
                {recentScores.map((score, idx) => (
                  <ScoreCard
                    key={idx}
                    score={score}
                    onDetailsClick={() => setSelectedScore(score)}
                  />
                ))}

                {hasMoreScores && (
                  <div className="pt-2 flex justify-center">
                    <Button
                      variant="secondary"
                      loading={loadingScores}
                      onClick={handleLoadMoreScores}
                      className="text-xs py-2 px-4 h-9 min-h-[36px]"
                    >
                      Load More
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Score Details Modal */}
        {selectedScore && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setSelectedScore(null)}></div>
            
            <Card className="relative w-full max-w-2xl bg-white shadow-2xl z-10 p-6 max-h-[85vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-lg font-bold font-display text-green-dark">Scorecard Details</h3>
                  <p className="text-xs text-grey-mid mt-0.5">
                    {selectedScore.clubName} · Played on {new Date(selectedScore.playedOn).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                  {selectedScore.courseName && (
                    <p className="text-xs text-grey-mid mt-0.5">Course: {selectedScore.courseName} ({selectedScore.teeColour} Tee)</p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedScore(null)}
                  className="p-1 rounded-full hover:bg-off-white text-grey-mid cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Aggregated totals */}
              <div className="grid grid-cols-3 gap-4 mb-6 bg-off-white p-3 rounded-lg border border-grey-light text-center">
                <div>
                  <p className="text-[10px] text-grey-mid uppercase font-semibold">Stableford Points</p>
                  <p className="text-lg font-bold text-green-dark numeral-mono mt-0.5">{selectedScore.points}</p>
                </div>
                <div>
                  <p className="text-[10px] text-grey-mid uppercase font-semibold">Total Shots</p>
                  <p className="text-lg font-bold text-black numeral-mono mt-0.5">{selectedScore.shots}</p>
                </div>
                <div>
                  <p className="text-[10px] text-grey-mid uppercase font-semibold">Playing Handicap</p>
                  <p className="text-lg font-bold text-black numeral-mono mt-0.5">{parseFloat(selectedScore.handicapUsed || user?.handicap).toFixed(1)}</p>
                </div>
              </div>

              {/* Hole scores table wrapper */}
              <div className="overflow-x-auto border border-grey-light rounded-lg">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-off-white border-b border-grey-light text-grey-mid uppercase font-semibold text-[10px] tracking-wider">
                      <th className="py-2 px-3 text-center">Hole</th>
                      <th className="py-2 px-3 text-center">Par</th>
                      <th className="py-2 px-3 text-center">SI</th>
                      <th className="py-2 px-3 text-center">Shots</th>
                      <th className="py-2 px-3 text-center">Allowance</th>
                      <th className="py-2 px-3 text-center">Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedScore.holeScores || []).map((h) => (
                      <tr key={h.hole} className="border-b border-grey-light hover:bg-off-white/40">
                        <td className="py-2 px-3 text-center font-bold text-black">{h.hole}</td>
                        <td className="py-2 px-3 text-center text-grey-mid">{h.par}</td>
                        <td className="py-2 px-3 text-center text-grey-mid">{h.strokeIndex}</td>
                        <td className="py-2 px-3 text-center font-semibold text-black">{h.shots || '-'}</td>
                        <td className="py-2 px-3 text-center text-grey-mid">+{h.strokeAllowance || 0}</td>
                        <td className="py-2 px-3 text-center font-bold text-green-dark numeral-mono">{h.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 flex justify-end">
                <Button variant="secondary" onClick={() => setSelectedScore(null)} className="h-9 min-h-[36px] text-xs">
                  Close Scorecard
                </Button>
              </div>
            </Card>
          </div>
        )}
      </PageWrapper>
    </ProtectedRoute>
  )
}
