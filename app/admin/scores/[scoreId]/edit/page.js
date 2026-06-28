'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import ProtectedRoute from '../../../../../components/auth/ProtectedRoute'
import PageWrapper from '../../../../../components/layout/PageWrapper'
import Card from '../../../../../components/ui/Card'
import Input from '../../../../../components/ui/Input'
import Button from '../../../../../components/ui/Button'
import Skeleton from '../../../../../components/ui/Skeleton'
import HoleScoreInput from '../../../../../components/scores/HoleScoreInput'
import useAuthStore from '../../../../../store/useAuthStore'
import { adminListScores, adminEditScore, adminDeleteScore } from '../../../../../lib/api'
import { calculateRoundPoints } from '../../../../../lib/stableford'
import { COURSE_HOLES } from '../../../../../lib/courseData'
import { toast } from 'react-hot-toast'
import { ArrowLeft, CheckSquare, Trash2, X, AlertTriangle } from 'lucide-react'

export default function AdminEditScorePage() {
  const router = useRouter()
  const { scoreId } = useParams()
  const { user, isLoading, initialize } = useAuthStore()

  // Initialize auth store synchronously on first render to prevent empty user check on mount
  if (typeof window !== 'undefined' && isLoading) {
    initialize()
  }

  // Score states
  const [score, setScore] = useState(null)
  const [loadingScore, setLoadingScore] = useState(true)
  const [originalPoints, setOriginalPoints] = useState(0)

  // Form states
  const [handicap, setHandicap] = useState('')
  const [holeScores, setHoleScores] = useState([])
  const [auditNote, setAuditNote] = useState('')
  const [saving, setSaving] = useState(false)

  // Delete modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteNote, setDeleteNote] = useState('')
  const [deleting, setDeleting] = useState(false)

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

  // Load score details
  useEffect(() => {
    if (!user || !user.is_admin || !scoreId) return

    const loadScore = async () => {
      setLoadingScore(true)
      try {
        // Query list with high limit to find matching score
        const response = await adminListScores({ include_deleted: true, per_page: 100 })
        const scores = response.data?.scores || response.data?.items || response.data || []
        const found = scores.find((s) => s.id === scoreId)

        if (found) {
          setScore(found)
          setOriginalPoints(found.stableford_points || 0)
          setHandicap(found.handicap_used !== undefined ? found.handicap_used.toString() : '0.0')
          
          // Map backend hole scores to canonical holes from COURSE_HOLES
          const mappedHoles = COURSE_HOLES.map((canonicalHole) => {
            const match = found.hole_scores?.find((h) => h.hole === canonicalHole.hole)
            return {
              ...canonicalHole,
              shots: match ? (match.shots === 0 ? 0 : (match.shots || '')) : ''
            }
          })
          setHoleScores(mappedHoles)
        }
      } catch (e) {
        console.error('Failed to load score details:', e)
        toast.error('Failed to load score details.')
      } finally {
        setLoadingScore(false)
      }
    }
    loadScore()
  }, [scoreId])

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

  const handleHoleChange = (index, field, value) => {
    setHoleScores((prevScores) =>
      prevScores.map((h, i) => (i === index ? { ...h, [field]: value } : h))
    )
  }

  const handleSaveChanges = async () => {
    const emptyHoles = holeScores.filter((h) => h.shots === '')
    if (emptyHoles.length > 0) {
      toast.error('Please enter gross shots for all 18 holes. Enter 0 if did not complete.')
      return
    }

    if (auditNote.trim().length < 10) {
      toast.error('Reason for edit must be at least 10 characters.')
      return
    }

    setSaving(true)
    try {
      const payload = {
        hole_scores: holeScores.map((h) => ({
          hole: h.hole,
          par: h.par,
          stroke_index: h.si,
          shots: Number(h.shots)
        })),
        gross_shots: totalShots,
        stableford_points: totalPoints,
        admin_note: auditNote
      }

      await adminEditScore(scoreId, payload)
      toast.success('Score updated successfully')
      router.push('/admin/scores')
    } catch (e) {
      console.error('Failed to edit score:', e)
      const detail = e.response?.data?.detail || e.response?.data?.message || 'Failed to update score.'
      toast.error(detail)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteScore = async () => {
    if (deleteNote.trim().length < 10) {
      toast.error('Delete note must be at least 10 characters.')
      return
    }

    setDeleting(true)
    try {
      await adminDeleteScore(scoreId, deleteNote)
      toast.success('Score deleted')
      setShowDeleteModal(false)
      router.push('/admin/scores')
    } catch (e) {
      console.error('Failed to delete score:', e)
      const detail = e.response?.data?.detail || e.response?.data?.message || 'Failed to delete score.'
      toast.error(detail)
    } finally {
      setDeleting(false)
    }
  }

  // Formatting Date helper
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

  // Loading validations check
  if (isLoading || !user || !user.is_admin) {
    return (
      <PageWrapper className="flex flex-col items-center justify-center min-h-[70vh]">
        <div className="w-12 h-12 bg-green-light rounded-full animate-ping mb-4"></div>
        <p className="text-xs text-grey-mid font-semibold">Validating credentials...</p>
      </PageWrapper>
    )
  }

  if (loadingScore) {
    return (
      <PageWrapper>
        <Skeleton variant="text" className="h-8 w-1/4 mb-4" />
        <Skeleton variant="rect" className="h-64 w-full rounded-lg" />
      </PageWrapper>
    )
  }

  if (!score) {
    return (
      <PageWrapper className="flex flex-col items-center justify-center min-h-[50vh]">
        <h2 className="text-lg font-bold text-black mb-2">Score Not Found</h2>
        <p className="text-xs text-grey-mid mb-4">The requested score ID does not exist or you do not have permission to view it.</p>
        <Link href="/admin/scores">
          <Button variant="secondary" className="text-xs h-9 px-4">
            Back to Scores List
          </Button>
        </Link>
      </PageWrapper>
    )
  }

  const isDeleted = score.deleted_at !== null
  const playerFullName = score.player_name || score.full_name || (score.user && score.user.full_name) || 'Unknown Player'
  const editedBy = score.admin_edited_by_name || score.admin_edited_by
  const editedAt = score.admin_edited_at
  const previousEditNote = score.admin_edit_note

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
            <span className="font-medium">Back to Scores List</span>
          </Link>
          <h1 className="text-2xl md:text-3.5xl font-bold font-display text-green-dark">
            Edit Scorecard (Admin)
          </h1>
          <p className="text-sm text-grey-mid font-medium mt-1">
            Modify handicap, scorecard shots, and capture audit notes.
          </p>
        </div>

        {/* Soft-Deleted Alert Banner */}
        {isDeleted && (
          <div className="bg-red-50 text-red-800 text-xs border border-red-200/60 p-4 rounded-lg flex items-start gap-2 mb-6">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <div>
              <p className="font-bold">This score has been soft-deleted.</p>
              <p className="mt-0.5">You can still edit its scorecard details, but it is currently excluded from leaderboards.</p>
              <p className="mt-1 font-semibold">Delete Note: <span className="italic font-normal">{score.delete_note || 'No reason specified'}</span></p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Section 1: Score Info card — read-only header */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="p-5 border border-grey-light bg-white shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-black border-b border-grey-light pb-2">
                Score Info
              </h3>
              <div className="space-y-3.5">
                <div>
                  <p className="text-[10px] font-bold text-grey-mid uppercase tracking-wider">Player</p>
                  <p className="text-sm font-semibold text-black mt-0.5">{playerFullName}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-grey-mid uppercase tracking-wider">Club</p>
                  <p className="text-sm font-semibold text-black mt-0.5">{score.club_name || 'Generic Club'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-grey-mid uppercase tracking-wider">Date Played</p>
                  <p className="text-sm font-semibold text-black mt-0.5">{formatDate(score.played_on)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-grey-mid uppercase tracking-wider">Course / Tees</p>
                  <p className="text-sm font-semibold text-black mt-0.5">
                    {score.course_name || '-'} {score.tee_colour && `(${score.tee_colour})`}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-grey-mid uppercase tracking-wider">Submitted On</p>
                  <p className="text-xs text-grey-mid mt-0.5">{formatDate(score.created_at)}</p>
                </div>
              </div>
            </Card>

            {/* Previously Edited Info Box */}
            {previousEditNote && (
              <Card className="p-4 border border-grey-light bg-off-white text-xs space-y-2">
                <p className="font-bold text-black flex items-center gap-1">
                  <span>✏️</span>
                  <span>Last edited by {editedBy || 'admin'} {editedAt && `on ${formatDate(editedAt)}`}</span>
                </p>
                <p className="italic text-grey-mid">
                  &ldquo;{previousEditNote}&rdquo;
                </p>
              </Card>
            )}
          </div>

          {/* Section 2: 18-hole scorecard table */}
          <div className="lg:col-span-8 space-y-6">
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

            {/* Live Stableford Points comparisons */}
            <Card className="bg-green-light/10 border-green-mid/20 p-5">
              <p className="text-xs font-semibold text-grey-mid uppercase tracking-wide">
                Stableford Points Progression
              </p>
              <p className="text-lg md:text-xl font-bold text-black mt-1">
                Original Points: <span className="numeral-mono text-grey-mid">{originalPoints} pts</span>
                {originalPoints !== totalPoints ? (
                  <>
                    <span className="text-grey-mid mx-1.5">&rarr;</span>
                    New Calculated: <span className="numeral-mono text-green-dark">{totalPoints} pts</span>
                  </>
                ) : (
                  <span className="text-xs text-grey-mid font-medium ml-2">(Unchanged)</span>
                )}
              </p>
              <p className="text-xs text-grey-mid font-medium mt-1">
                New Shots: <span className="numeral-mono font-bold text-black">{totalShots} total shots</span>
              </p>
            </Card>
          </div>

          {/* Section 3: Audit edit notes form (Save Adjustments) */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="p-5 border border-grey-light bg-white shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-black border-b border-grey-light pb-2">
                Save Adjustments
              </h3>
              
              <Input
                label="Playing Handicap (0-54)"
                type="number"
                step="0.1"
                min="0.0"
                max="54.0"
                value={handicap}
                onChange={(e) => setHandicap(e.target.value)}
              />

              <div>
                <label className="text-[10px] font-bold text-grey-mid uppercase tracking-wider block mb-1.5">
                  Reason for edit (required)
                </label>
                <textarea
                  placeholder="Explain why you are modifying this scorecard (min 10 chars)..."
                  value={auditNote}
                  onChange={(e) => setAuditNote(e.target.value)}
                  maxLength={1000}
                  rows={4}
                  className="w-full bg-white text-black border border-grey-light rounded-[8px] px-3.5 py-2.5 text-xs focus:border-green-dark outline-none focus:ring-1 focus:ring-green-dark"
                />
                <div className="flex justify-between items-center text-[10px] text-grey-mid mt-1">
                  <span>Minimum 10 characters</span>
                  <span>{auditNote.length} / 1000</span>
                </div>
              </div>

              <Button
                variant="primary"
                loading={saving}
                disabled={auditNote.trim().length < 10}
                onClick={handleSaveChanges}
                className="w-full h-10 min-h-0 text-xs font-bold bg-[#2D6A4F] hover:bg-[#1B4332] text-white rounded-[8px]"
              >
                Save Changes
              </Button>

              {/* Delete button (Soft Delete) */}
              {!isDeleted && (
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  className="w-full mt-2 h-10 border border-red-soft/30 bg-red-50 text-[#FF6B6B] hover:bg-[#FF6B6B]/10 rounded-[8px] text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Scorecard</span>
                </button>
              )}
            </Card>
          </div>
        </div>

        {/* Confirmation Soft-Delete Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-xs"
              onClick={() => setShowDeleteModal(false)}
            ></div>
            <Card className="relative w-full max-w-md bg-white shadow-2xl z-10 p-6">
              <div className="flex justify-between items-start mb-4 pb-2.5 border-b border-grey-light">
                <div>
                  <h3 className="text-base font-bold text-black">Confirm Scorecard Deletion</h3>
                  <p className="text-xs text-grey-mid mt-0.5">Player: {playerFullName}</p>
                </div>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="p-1 rounded-full hover:bg-off-white text-grey-mid cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-red-50 text-red-800 text-xs border border-red-200/50 p-3 rounded-lg flex items-start gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>
                    This action will soft-delete the score, immediately removing it from all rankings and leaderboards.
                  </span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-grey-mid uppercase tracking-wider block mb-1.5">
                    Delete Audit Note (required, min 10 chars)
                  </label>
                  <textarea
                    placeholder="Provide audit trail details (e.g. Score was duplicated / User submitted incorrect test scorecard)..."
                    value={deleteNote}
                    onChange={(e) => setDeleteNote(e.target.value)}
                    maxLength={500}
                    rows={4}
                    className="w-full bg-white text-black border border-grey-light rounded-[8px] px-3.5 py-2.5 text-xs focus:border-green-dark outline-none focus:ring-1 focus:ring-green-dark"
                  />
                  <div className="flex justify-between items-center text-[10px] text-grey-mid mt-1">
                    <span>Minimum 10 characters</span>
                    <span>{deleteNote.length} / 500</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3 pt-3 border-t border-grey-light">
                <Button
                  variant="secondary"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleting}
                  className="h-9 min-h-0 text-xs px-4"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  loading={deleting}
                  disabled={deleteNote.trim().length < 10}
                  onClick={handleDeleteScore}
                  className="h-9 min-h-0 text-xs px-5 bg-[#FF6B6B] hover:bg-[#FF6B6B]/90 border-[#FF6B6B] text-white font-semibold"
                >
                  Confirm Delete
                </Button>
              </div>
            </Card>
          </div>
        )}
      </PageWrapper>
    </ProtectedRoute>
  )
}
