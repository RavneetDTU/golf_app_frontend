'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ProtectedRoute from '../../../components/auth/ProtectedRoute'
import PageWrapper from '../../../components/layout/PageWrapper'
import Card from '../../../components/ui/Card'
import Input from '../../../components/ui/Input'
import Button from '../../../components/ui/Button'
import Skeleton from '../../../components/ui/Skeleton'
import EmptyState from '../../../components/ui/EmptyState'
import HoleScoreInput from '../../../components/scores/HoleScoreInput'
import ScanCard from '../../../components/scores/ScanCard'
import useAuthStore from '../../../store/useAuthStore'
import { getClubs, createGame, submitScore, updateProfile } from '../../../lib/api'
import { calculateRoundPoints } from '../../../lib/stableford'
import { savePendingScore } from '../../../lib/offline'
import { toast } from 'react-hot-toast'
import { ArrowLeft, ArrowRight, Save, Calendar, CheckSquare, Pencil, Check } from 'lucide-react'
import { COURSE_HOLES } from '@/lib/courseData'

export default function NewScorePage() {
  const router = useRouter()
  const { user, token, initialize } = useAuthStore()

  // Step state (1: Game Details, 2: Hole Scores)
  const [step, setStep] = useState(1)

  // Handicap states
  const [isEditingHandicap, setIsEditingHandicap] = useState(false)
  const [handicapValue, setHandicapValue] = useState(null)
  const [handicapInput, setHandicapInput] = useState('')
  const [handicapError, setHandicapError] = useState('')

  // Sync handicap states once user is hydrated
  useEffect(() => {
    if (user?.handicap !== undefined && handicapValue === null) {
      setHandicapValue(user.handicap)
      setHandicapInput(user.handicap.toString())
    }
  }, [user, handicapValue])
  
  // Form states
  const [clubs, setClubs] = useState([])
  const [loadingClubs, setLoadingClubs] = useState(true)
  const [selectedClubId, setSelectedClubId] = useState('')
  const [playedOn, setPlayedOn] = useState('')
  const [courseName, setCourseName] = useState('')
  const [teeColour, setTeeColour] = useState('Yellow')
  const [notes, setNotes] = useState('')

  // Scores state (array of 18 holes)
  const [holeScores, setHoleScores] = useState(
    COURSE_HOLES.map((h) => ({ ...h, shots: '' }))
  )

  const [submitting, setSubmitting] = useState(false)

  // Initialize store and prepopulate today's date
  useEffect(() => {
    initialize()
    const today = new Date().toISOString().split('T')[0]
    setPlayedOn(today)
  }, [initialize])

  // Fetch joined clubs for the dropdown
  useEffect(() => {
    if (!token) return
    const fetchClubsData = async () => {
      setLoadingClubs(true)
      try {
        const response = await getClubs(1)
        const allClubs = response.data?.clubs || []
        // Only show clubs where the user is a member
        const memberClubs = allClubs.filter((c) => c.is_member)
        setClubs(memberClubs)
        if (memberClubs.length > 0) {
          setSelectedClubId(memberClubs[0].id)
        }
      } catch (e) {
        console.error('Failed to load clubs list:', e)
      } finally {
        setLoadingClubs(false)
      }
    }
    fetchClubsData()
  }, [token])

  // Compute live aggregates using client stableford calculator
  const currentHandicap = handicapValue !== null ? handicapValue : (user?.handicap || 0.0)
  const { totalPoints, totalShots } = calculateRoundPoints(
    holeScores.map((h) => ({
      ...h,
      strokeIndex: h.si,
      shots: h.shots === '' ? 0 : Number(h.shots)
    })),
    currentHandicap
  )

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

  const handleSaveHandicapLocal = () => {
    if (handicapInput === '') {
      setHandicapError('Handicap is required')
      return
    }
    const parsed = parseFloat(handicapInput)
    if (isNaN(parsed) || parsed < 0 || parsed > 54) {
      setHandicapError('Handicap must be between 0 and 54')
      return
    }
    setHandicapValue(parsed)
    setHandicapError('')
    setIsEditingHandicap(false)
  }

  const handleNextStep = () => {
    if (!selectedClubId) {
      toast.error('Please select a golf club.')
      return
    }
    if (!playedOn) {
      toast.error('Please enter the date played.')
      return
    }
    setStep(2)
  }

  const handleBackToDetails = () => {
    if (isEditingHandicap) {
      // Discard edit: reset handicapInput to current saved handicapValue
      setHandicapInput((handicapValue !== null ? handicapValue : (user?.handicap || 0.0)).toString())
      setHandicapError('')
      setIsEditingHandicap(false)
    }
    setStep(1)
  }

  const handleHoleChange = (index, field, value) => {
    setHoleScores((prevScores) =>
      prevScores.map((h, i) => (i === index ? { ...h, [field]: value } : h))
    )
  }

  const handleScanComplete = (scannedHoles) => {
    setHoleScores((prevScores) =>
      prevScores.map((h) => {
        const match = scannedHoles.find((sh) => sh.hole === h.hole)
        if (match) {
          return {
            ...h,
            shots: match.shots !== undefined ? match.shots : ''
          }
        }
        return h
      })
    )
    toast.success('Scorecard prefilled! Please review and correct any errors.')
  }

  const handleSubmitScorecard = async () => {
    // Validate that shots are entered
    const emptyHoles = holeScores.filter((h) => h.shots === '')
    if (emptyHoles.length > 0) {
      toast.error('Please enter gross shots for all 18 holes. Enter 0 if did not complete.')
      return
    }

    // Validate handicap
    const finalHandicapStr = isEditingHandicap ? handicapInput : (handicapValue !== null ? handicapValue.toString() : (user?.handicap || 0.0).toString())
    if (finalHandicapStr === '') {
      setHandicapError('Handicap is required')
      toast.error('Handicap is required')
      return
    }
    const parsedHandicap = parseFloat(finalHandicapStr)
    if (isNaN(parsedHandicap) || parsedHandicap < 0 || parsedHandicap > 54) {
      setHandicapError('Handicap must be between 0 and 54')
      toast.error('Handicap must be between 0 and 54')
      return
    }

    // Save final handicap values to local state and exit edit mode
    setHandicapValue(parsedHandicap)
    setIsEditingHandicap(false)

    setSubmitting(true)
    try {
      // Step A: Create Game
      const gameResponse = await createGame({
        club_id: selectedClubId,
        played_on: playedOn,
        course_name: courseName || null,
        tee_colour: teeColour || null,
        notes: notes || null
      })
      const gameId = gameResponse.data.id

      // Step B: Submit Score
      // Map strokeIndex client-side field to backend stroke_index Pydantic field
      const formattedScores = holeScores.map((h) => ({
        hole: h.hole,
        par: h.par,
        stroke_index: h.si,
        shots: Number(h.shots)
      }))

      const scoreResponse = await submitScore(gameId, {
        hole_scores: formattedScores,
        handicap_override: parsedHandicap
      })

      // Step C: Update profile with new handicap silently
      let profileUpdated = true
      try {
        const profileResponse = await updateProfile({ handicap: parsedHandicap })
        useAuthStore.getState().updateUser(profileResponse.data)
      } catch (profileErr) {
        console.error('Failed to update profile handicap:', profileErr)
        profileUpdated = false
      }

      // Step D: Cache score locally in localStorage to display on personal dashboard
      const selectedClub = clubs.find((c) => c.id === selectedClubId)
      const selectedClubName = selectedClub ? selectedClub.name : 'Golf Club'
      
      const localScoresKey = `golf_scores_${user.id}`
      const cachedScores = JSON.parse(localStorage.getItem(localScoresKey) || '[]')
      const newLocalScore = {
        id: scoreResponse.data.id,
        gameId: gameId,
        clubName: selectedClubName,
        playedOn,
        courseName,
        teeColour,
        points: scoreResponse.data.stableford_points,
        shots: scoreResponse.data.gross_shots,
        handicapUsed: scoreResponse.data.handicap_used,
        holeScores: scoreResponse.data.hole_scores, // detailed scores
        date: playedOn
      }
      
      cachedScores.push(newLocalScore)
      localStorage.setItem(localScoresKey, JSON.stringify(cachedScores))

      if (profileUpdated) {
        toast.success('Scorecard submitted successfully!')
      } else {
        toast.error('Score saved. Handicap update failed — please update manually from dashboard')
      }
      router.push('/dashboard')
    } catch (err) {
      console.error('Failed to submit scorecard:', err)
      
      // If it fails because of network / offline
      if (!err.response) {
        try {
          const formattedScores = holeScores.map((h) => ({
            hole: h.hole,
            par: h.par,
            stroke_index: h.si,
            shots: Number(h.shots)
          }))
          const selectedClub = clubs.find((c) => c.id === selectedClubId)
          const selectedClubName = selectedClub ? selectedClub.name : 'Golf Club'

          await savePendingScore({
            club_id: selectedClubId,
            club_name: selectedClubName,
            played_on: playedOn,
            course_name: courseName || null,
            tee_colour: teeColour || null,
            notes: notes || null,
            hole_scores: formattedScores,
            handicap_override: parsedHandicap
          })

          toast.success("You're offline. Score saved locally and will sync automatically.")
          router.push('/dashboard')
          return
        } catch (dbErr) {
          console.error('Failed to save score offline:', dbErr)
          toast.error('Failed to save score offline.')
        }
      }

      const message = err.response?.data?.detail || err.response?.data?.message || 'Failed to submit score. Please try again.'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ProtectedRoute>
      <PageWrapper>
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center space-x-2 text-sm text-grey-mid hover:text-black transition-colors mb-4 group cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span className="font-medium">Back to Dashboard</span>
          </Link>
          <h1 className="text-2xl md:text-3.5xl font-bold font-display text-green-dark">
            Add Score
          </h1>
          <p className="text-sm text-grey-mid font-medium mt-1">
            {step === 1 ? 'Step 1: Enter round details' : 'Step 2: Enter hole scores'}
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center space-x-2 mb-8">
          <span className={`text-xs font-bold px-2 py-1 rounded-full ${step === 1 ? 'bg-green-dark text-white' : 'bg-grey-light text-grey-mid'}`}>
            1
          </span>
          <span className="w-8 h-0.5 bg-grey-light"></span>
          <span className={`text-xs font-bold px-2 py-1 rounded-full ${step === 2 ? 'bg-green-dark text-white' : 'bg-grey-light text-grey-mid'}`}>
            2
          </span>
        </div>

        {/* STEP 1: Game Details Form */}
        {step === 1 && (
          <div className="max-w-xl">
            <Card className="shadow-sm border border-grey-light p-6 md:p-8">
              {loadingClubs ? (
                <div className="space-y-4">
                  <Skeleton variant="text" className="h-6 w-1/4" />
                  <Skeleton variant="rect" className="h-10 rounded" />
                </div>
              ) : clubs.length === 0 ? (
                <EmptyState
                  title="Must Join a Club First"
                  description="You cannot submit scores until you are a member of at least one club."
                  actionLabel="Browse Clubs"
                  onActionClick={() => router.push('/clubs')}
                />
              ) : (
                <div className="space-y-5">
                  {/* Club Select */}
                  <div>
                    <label className="text-xs font-semibold text-grey-mid uppercase tracking-wider block mb-1.5">
                      Select Golf Club
                    </label>
                    <select
                      value={selectedClubId}
                      onChange={(e) => setSelectedClubId(e.target.value)}
                      className="w-full bg-white text-black border border-grey-light rounded-[8px] px-3.5 py-2.5 text-sm focus:border-green-dark focus:ring-1 focus:ring-green-dark outline-none h-11"
                    >
                      {clubs.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Date Input */}
                  <div>
                    <label className="text-xs font-semibold text-grey-mid uppercase tracking-wider block mb-1.5">
                      Date Played
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={playedOn}
                        onChange={(e) => setPlayedOn(e.target.value)}
                        className="w-full bg-white text-black border border-grey-light rounded-[8px] px-3.5 py-2.5 text-sm focus:border-green-dark focus:ring-1 focus:ring-green-dark outline-none h-11"
                      />
                    </div>
                  </div>

                  {/* Course Name */}
                  <Input
                    label="Course Name (optional)"
                    type="text"
                    placeholder="e.g. West Course, Championship Loop"
                    value={courseName}
                    onChange={(e) => setCourseName(e.target.value)}
                  />

                  {/* Tee Colour Select */}
                  <div>
                    <label className="text-xs font-semibold text-grey-mid uppercase tracking-wider block mb-1.5">
                      Tee Colour (optional)
                    </label>
                    <select
                      value={teeColour}
                      onChange={(e) => setTeeColour(e.target.value)}
                      className="w-full bg-white text-black border border-grey-light rounded-[8px] px-3.5 py-2.5 text-sm focus:border-green-dark focus:ring-1 focus:ring-green-dark outline-none h-11"
                    >
                      <option value="Yellow">Yellow</option>
                      <option value="White">White</option>
                      <option value="Blue">Blue</option>
                      <option value="Red">Red</option>
                      <option value="Black">Black</option>
                    </select>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="text-xs font-semibold text-grey-mid uppercase tracking-wider block mb-1.5">
                      Notes (optional)
                    </label>
                    <textarea
                      placeholder="e.g. Weather conditions, playing partners..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      className="w-full bg-white text-black border border-grey-light rounded-[8px] px-3.5 py-2.5 text-sm focus:border-green-dark focus:ring-1 focus:ring-green-dark outline-none"
                    />
                  </div>

                  {/* Next Step Button */}
                  <Button
                    variant="primary"
                    onClick={handleNextStep}
                    className="w-full mt-4 flex items-center justify-center space-x-2 text-base font-semibold py-3 h-11"
                  >
                    <span>Next: Enter Scores</span>
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* STEP 2: Hole Scores Table */}
        {step === 2 && (
          <div className="space-y-6">
            {/* Subtle Step 2 Navigation and Handicap Row */}
            <div className="flex items-center justify-between text-xs text-grey-mid py-1">
              <button
                type="button"
                onClick={handleBackToDetails}
                className="flex items-center gap-1 hover:text-black transition-colors cursor-pointer text-grey-mid bg-transparent border-0 p-0"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to details</span>
              </button>
              
              <div className="flex items-center gap-1.5 font-medium relative">
                <span>Handicap:</span>
                {!isEditingHandicap ? (
                  <>
                    <span className="text-black font-semibold numeral-mono">
                      {currentHandicap.toFixed(1)}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingHandicap(true)
                        setHandicapInput(currentHandicap.toString())
                        setHandicapError('')
                      }}
                      className="p-1 hover:bg-grey-light/40 rounded transition-colors text-grey-mid hover:text-black cursor-pointer bg-transparent border-0 flex items-center justify-center p-0.5"
                      title="Edit Handicap"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <>
                    <input
                      type="number"
                      min={0}
                      max={54}
                      step={0.1}
                      value={handicapInput}
                      onChange={(e) => handleHandicapChange(e.target.value)}
                      className="w-[60px] bg-white text-black border border-grey-light rounded px-1.5 py-0.5 text-center text-xs focus:border-green-dark focus:ring-1 focus:ring-green-dark outline-none h-7"
                    />
                    <button
                      type="button"
                      onClick={handleSaveHandicapLocal}
                      className="p-1 hover:bg-grey-light/40 rounded transition-colors text-green-dark hover:text-green-mid cursor-pointer bg-transparent border-0 flex items-center justify-center p-0.5"
                      title="Save Handicap"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </>
                )}
                {handicapError && (
                  <span className="absolute top-full right-0 text-[10px] text-red-soft mt-0.5 whitespace-nowrap bg-white px-1 shadow-xs border border-grey-light/40 rounded z-10">
                    {handicapError}
                  </span>
                )}
              </div>
            </div>

            {/* Scorecard Camera Scanner */}
            <ScanCard onScanComplete={handleScanComplete} />

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
                      handicap={currentHandicap}
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
                onClick={handleSubmitScorecard}
                className="w-full md:w-auto px-8 py-3 text-base font-semibold h-11 flex items-center justify-center space-x-2"
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
