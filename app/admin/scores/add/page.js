'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ProtectedRoute from '../../../../components/auth/ProtectedRoute'
import PageWrapper from '../../../../components/layout/PageWrapper'
import Card from '../../../../components/ui/Card'
import Input from '../../../../components/ui/Input'
import Button from '../../../../components/ui/Button'
import HoleScoreInput from '../../../../components/scores/HoleScoreInput'
import useAuthStore from '../../../../store/useAuthStore'
import { adminGetUsers, getClubs, adminAddScore } from '../../../../lib/api'
import { calculateRoundPoints } from '../../../../lib/stableford'
import { COURSE_HOLES } from '../../../../lib/courseData'
import { toast } from 'react-hot-toast'
import { ArrowLeft, ArrowRight, CheckSquare, Search, User } from 'lucide-react'

export default function AdminAddScorePage() {
  const router = useRouter()
  const { user, isLoading, initialize } = useAuthStore()

  // Steps state (1: Details, 2: Scorecard)
  const [step, setStep] = useState(1)

  // Player search & selection states
  const [playerSearchText, setPlayerSearchText] = useState('')
  const [usersList, setUsersList] = useState([])
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [showUsersDropdown, setShowUsersDropdown] = useState(false)

  // Game details states
  const [clubs, setClubs] = useState([])
  const [selectedClubId, setSelectedClubId] = useState('')
  const [playedOn, setPlayedOn] = useState('')
  const [courseName, setCourseName] = useState('The Baanigans Golf Course')
  const [teeColour, setTeeColour] = useState('Yellow')
  const [handicap, setHandicap] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Scores state (18 holes)
  const [holeScores, setHoleScores] = useState(
    COURSE_HOLES.map((h) => ({ ...h, shots: '' }))
  )

  // Auth initialization
  useEffect(() => {
    initialize()
    const today = new Date().toISOString().split('T')[0]
    setPlayedOn(today)
  }, [initialize])

  // Redirect non-admin users
  useEffect(() => {
    if (!isLoading && user && !user.is_admin) {
      router.replace('/dashboard')
    }
  }, [user, isLoading, router])

  // Fetch users when searching
  useEffect(() => {
    if (playerSearchText.trim().length === 0) {
      setUsersList([])
      setShowUsersDropdown(false)
      return
    }

    const timer = setTimeout(async () => {
      setLoadingUsers(true)
      try {
        const response = await adminGetUsers(1, playerSearchText)
        const foundUsers = response.data?.users || response.data || []
        setUsersList(foundUsers)
        setShowUsersDropdown(true)
      } catch (e) {
        console.error('Failed to search users:', e)
      } finally {
        setLoadingUsers(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [playerSearchText])

  // Fetch Clubs list once on mount
  useEffect(() => {
    if (!user || !user.is_admin) return

    const fetchClubs = async () => {
      try {
        const response = await getClubs(1)
        const allClubs = response.data?.clubs || []
        setClubs(allClubs)
      } catch (e) {
        console.error('Failed to load clubs list:', e)
      }
    }
    fetchClubs()
  }, [user])

  // Pre-fill handicap when player is selected
  useEffect(() => {
    if (selectedPlayer) {
      setHandicap(selectedPlayer.handicap !== undefined ? selectedPlayer.handicap.toString() : '0.0')
      // Auto select first club for convenience
      if (clubs.length > 0 && !selectedClubId) {
        // If user object contains specific clubs membership, filter by them
        const filtered = getFilteredClubs()
        if (filtered.length > 0) {
          setSelectedClubId(filtered[0].id)
        } else {
          setSelectedClubId(clubs[0].id)
        }
      }
    }
  }, [selectedPlayer, clubs])

  // Filter clubs the selected user is a member of (if provided in player response, else fallback to all clubs)
  const getFilteredClubs = () => {
    if (!selectedPlayer) return []
    return clubs.filter((club) => {
      if (selectedPlayer.clubs) {
        return selectedPlayer.clubs.some((c) => c.id === club.id)
      }
      if (selectedPlayer.club_ids) {
        return selectedPlayer.club_ids.includes(club.id)
      }
      // Fallback: show all clubs since we don't have membership info for other users client-side
      return true
    })
  }

  // Calculate live aggregates for running total
  const currentHandicap = handicap !== '' ? parseFloat(handicap) : 0.0
  const { totalPoints, totalShots } = calculateRoundPoints(
    holeScores.map((h) => ({
      ...h,
      strokeIndex: h.si,
      shots: h.shots === '' ? 0 : Number(h.shots)
    })),
    currentHandicap
  )

  const handleSelectPlayer = (player) => {
    setSelectedPlayer(player)
    setPlayerSearchText('')
    setShowUsersDropdown(false)
  }

  const handleNextStep = () => {
    if (!selectedPlayer) {
      toast.error('Please select a player.')
      return
    }
    if (!selectedClubId) {
      toast.error('Please select a golf club.')
      return
    }
    if (!playedOn) {
      toast.error('Please enter the date played.')
      return
    }
    if (handicap === '') {
      toast.error('Please enter a handicap.')
      return
    }
    const hNum = parseFloat(handicap)
    if (isNaN(hNum) || hNum < 0 || hNum > 54) {
      toast.error('Handicap must be a number between 0 and 54.')
      return
    }
    setStep(2)
  }

  const handleHoleChange = (index, field, value) => {
    setHoleScores((prevScores) =>
      prevScores.map((h, i) => (i === index ? { ...h, [field]: value } : h))
    )
  }

  const handleSubmitScore = async () => {
    // Validate all shots are entered
    const emptyHoles = holeScores.filter((h) => h.shots === '')
    if (emptyHoles.length > 0) {
      toast.error('Please enter gross shots for all 18 holes. Enter 0 if did not complete.')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        player_id: selectedPlayer.id,
        club_id: selectedClubId,
        game_date: playedOn,
        course_name: courseName,
        tee_colour: teeColour,
        notes: notes || null,
        handicap: parseFloat(handicap),
        hole_scores: holeScores.map((h) => ({
          hole: h.hole,
          par: h.par,
          stroke_index: h.si,
          shots: Number(h.shots)
        }))
      }

      const response = await adminAddScore(payload)
      const data = response.data
      
      let msg = 'Score added successfully'
      if (data?.game_created) {
        msg += ' (new game created)'
      }
      toast.success(msg)
      router.push('/admin/scores')
    } catch (err) {
      console.error('Failed to add score:', err)
      const status = err.response?.status
      if (status === 409) {
        toast.error('This player already has a score for this game date')
      } else {
        const detail = err.response?.data?.detail || err.response?.data?.message || 'Failed to submit score.'
        toast.error(detail)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const filteredClubs = getFilteredClubs()

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
        {/* Back Link & Header */}
        <div className="mb-6">
          <Link
            href="/admin/scores"
            className="inline-flex items-center space-x-2 text-sm text-grey-mid hover:text-black transition-colors mb-4 group cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span className="font-medium">Back to Score Management</span>
          </Link>
          <h1 className="text-2xl md:text-3.5xl font-bold font-display text-green-dark">
            Add Score (Admin)
          </h1>
          <p className="text-sm text-grey-mid font-medium mt-1">
            {step === 1 ? 'Step 1: Player & Game details' : 'Step 2: Scorecard values'}
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center space-x-2 mb-8">
          <span
            className={`text-xs font-bold px-2 py-1 rounded-full ${
              step === 1 ? 'bg-green-dark text-white' : 'bg-grey-light text-grey-mid'
            }`}
          >
            1
          </span>
          <span className="w-8 h-0.5 bg-grey-light"></span>
          <span
            className={`text-xs font-bold px-2 py-1 rounded-full ${
              step === 2 ? 'bg-green-dark text-white' : 'bg-grey-light text-grey-mid'
            }`}
          >
            2
          </span>
        </div>

        {/* STEP 1: Form details */}
        {step === 1 && (
          <div className="max-w-xl">
            <Card className="shadow-sm border border-grey-light p-6 md:p-8 space-y-5 bg-white">
              {/* Player selection (Searchable Dropdown) */}
              <div className="relative">
                <label className="text-[10px] font-bold text-grey-mid uppercase tracking-wider block mb-1.5">
                  Select Player (required)
                </label>
                {selectedPlayer ? (
                  <div className="flex items-center justify-between border border-green-mid/20 bg-green-light/10 rounded-[8px] p-3">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-green-dark" />
                      <div>
                        <p className="text-sm font-semibold text-black">{selectedPlayer.full_name}</p>
                        <p className="text-xs text-grey-mid">{selectedPlayer.email}</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      className="text-xs h-7 py-0 px-2.5"
                      onClick={() => setSelectedPlayer(null)}
                    >
                      Change
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 w-4 h-4 text-grey-mid" />
                      <input
                        type="text"
                        placeholder="Search by player name or email..."
                        value={playerSearchText}
                        onChange={(e) => setPlayerSearchText(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-grey-light bg-white text-black text-sm rounded-[8px] outline-none focus:border-green-dark h-11"
                      />
                    </div>

                    {showUsersDropdown && (
                      <div className="absolute top-full left-0 right-0 bg-white border border-grey-light rounded-md shadow-lg max-h-48 overflow-y-auto z-20 mt-1">
                        {loadingUsers ? (
                          <p className="p-3 text-xs text-grey-mid">Searching users...</p>
                        ) : usersList.length === 0 ? (
                          <p className="p-3 text-xs text-grey-mid">No users found.</p>
                        ) : (
                          usersList.map((user) => (
                            <div
                              key={user.id}
                              onClick={() => handleSelectPlayer(user)}
                              className="p-3 hover:bg-off-white text-sm text-black cursor-pointer border-b border-grey-light/40 last:border-b-0 flex flex-col"
                            >
                              <span className="font-semibold">{user.full_name}</span>
                              <span className="text-xs text-grey-mid">{user.email}</span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Club selection */}
              <div>
                <label className="text-[10px] font-bold text-grey-mid uppercase tracking-wider block mb-1.5">
                  Golf Club (required)
                </label>
                {!selectedPlayer ? (
                  <p className="text-xs text-grey-mid italic border border-dashed border-grey-light rounded-[8px] p-2.5 bg-off-white/40">
                    Select a player first to view clubs.
                  </p>
                ) : (
                  <select
                    value={selectedClubId}
                    onChange={(e) => setSelectedClubId(e.target.value)}
                    className="w-full bg-white text-black border border-grey-light rounded-[8px] px-3.5 py-2.5 text-sm focus:border-green-dark outline-none h-11"
                  >
                    <option value="">-- Choose Club --</option>
                    {filteredClubs.map((club) => (
                      <option key={club.id} value={club.id}>
                        {club.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Date selection */}
              <div>
                <label className="text-[10px] font-bold text-grey-mid uppercase tracking-wider block mb-1.5">
                  Date Played (required)
                </label>
                <input
                  type="date"
                  value={playedOn}
                  onChange={(e) => setPlayedOn(e.target.value)}
                  className="w-full bg-white text-black border border-grey-light rounded-[8px] px-3.5 py-2.5 text-sm focus:border-green-dark outline-none h-11"
                />
              </div>

              {/* Course Name & Tee Colour */}
              <Input
                label="Course Name (required)"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                placeholder="e.g. The Baanigans Golf Course"
              />

              <div>
                <label className="text-[10px] font-bold text-grey-mid uppercase tracking-wider block mb-1.5">
                  Tee Colour (required)
                </label>
                <select
                  value={teeColour}
                  onChange={(e) => setTeeColour(e.target.value)}
                  className="w-full bg-white text-black border border-grey-light rounded-[8px] px-3.5 py-2.5 text-sm focus:border-green-dark outline-none h-11"
                >
                  <option value="Yellow">Yellow</option>
                  <option value="White">White</option>
                  <option value="Blue">Blue</option>
                  <option value="Red">Red</option>
                  <option value="Black">Black</option>
                </select>
              </div>

              {/* Handicap */}
              <Input
                label="Playing Handicap (required, 0-54)"
                type="number"
                step="0.1"
                min="0.0"
                max="54.0"
                value={handicap}
                onChange={(e) => setHandicap(e.target.value)}
                placeholder="e.g. 18.2"
              />

              {/* Notes */}
              <div>
                <label className="text-[10px] font-bold text-grey-mid uppercase tracking-wider block mb-1.5">
                  Notes (optional)
                </label>
                <textarea
                  placeholder="Round notes (e.g., wind speed, tee time)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full bg-white text-black border border-grey-light rounded-[8px] px-3.5 py-2.5 text-sm focus:border-green-dark outline-none"
                />
              </div>

              {/* Info notice banner */}
              <div className="bg-blue-50 text-blue-800 text-xs border border-blue-200/60 p-3.5 rounded-lg flex items-start">
                <span className="mr-1.5">ℹ️</span>
                <span>
                  If a game already exists for this club on this date, the score will be added to that game automatically.
                </span>
              </div>

              {/* Next Step CTA */}
              <Button
                variant="primary"
                onClick={handleNextStep}
                className="w-full mt-4 flex items-center justify-center space-x-2 text-base font-semibold py-3 h-11 bg-green-dark text-white rounded-[8px]"
              >
                <span>Next: Enter Scores</span>
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Card>
          </div>
        )}

        {/* STEP 2: Scorecard Table */}
        {step === 2 && (
          <div className="space-y-6">
            {/* Header info bar */}
            <div className="flex items-center justify-between text-xs text-grey-mid py-1">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-1 hover:text-black transition-colors cursor-pointer text-grey-mid bg-transparent border-0 p-0"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to details</span>
              </button>

              <div className="font-semibold text-black">
                Player: <span className="text-green-dark">{selectedPlayer?.full_name}</span> (HCP: {parseFloat(handicap).toFixed(1)})
              </div>
            </div>

            {/* Scorecard Input Table */}
            <div className="overflow-x-auto border border-grey-light rounded-lg bg-white shadow-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-off-white border-b border-grey-light text-grey-mid uppercase text-[10px] font-bold tracking-wider">
                    <th className="py-2.5 px-3 text-center w-16">Hole</th>
                    <th className="py-2.5 px-3 text-center w-20">Par</th>
                    <th className="py-2.5 px-3 text-center w-20">SI</th>
                    <th className="py-2.5 px-3 text-center w-28">Shots</th>
                    <th className="py-2.5 px-3 text-center w-20">Allowance</th>
                    <th className="py-2.5 px-3 text-center w-24">Points</th>
                  </tr>
                </thead>
                <tbody>
                  {holeScores.map((holeData, idx) => (
                    <HoleScoreInput
                      key={holeData.hole}
                      holeData={holeData}
                      handicap={parseFloat(handicap)}
                      onShotsChange={(val) => handleHoleChange(idx, 'shots', val)}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Running Totals Bar & Submit */}
            <Card className="bg-green-light/10 border-green-mid/20 p-5 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-center md:text-left">
                <p className="text-xs font-semibold text-grey-mid uppercase tracking-wide">
                  Calculated Running Total
                </p>
                <p className="text-lg md:text-xl font-bold text-black mt-0.5">
                  Total:{' '}
                  <span className="numeral-mono">{totalShots}</span> shots ·{' '}
                  <span className="numeral-mono text-green-dark">{totalPoints}</span> pts
                </p>
              </div>

              <Button
                variant="primary"
                loading={submitting}
                onClick={handleSubmitScore}
                className="w-full md:w-auto px-8 py-3 text-base font-semibold h-11 flex items-center justify-center space-x-2 bg-green-dark text-white rounded-[8px]"
              >
                <CheckSquare className="w-5 h-5" />
                <span>Submit Scorecard</span>
              </Button>
            </Card>
          </div>
        )}
      </PageWrapper>
    </ProtectedRoute>
  )
}
