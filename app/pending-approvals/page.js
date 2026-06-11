'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import ProtectedRoute from '../../components/auth/ProtectedRoute'
import PageWrapper from '../../components/layout/PageWrapper'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Skeleton from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import PendingScoreCard from '../../components/pending/PendingScoreCard'
import HoleScoreInput from '../../components/scores/HoleScoreInput'
import useAuthStore from '../../store/useAuthStore'
import {
  getMyPendingScores,
  approvePendingScore,
  rejectPendingScore,
  editAndSubmitPending
} from '../../lib/api'
import { calculateRoundPoints } from '../../lib/stableford'
import { toast } from 'react-hot-toast'
import { ArrowLeft, CheckSquare, X, Info } from 'lucide-react'

export default function PendingApprovalsPage() {
  const { user, initialize } = useAuthStore()
  
  const [pendingList, setPendingList] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [activeActionId, setActiveActionId] = useState(null)
  const [actionType, setActionType] = useState(null) // 'approve' | 'reject' | 'edit'

  // Edit sub-view state
  const [editingScore, setEditingScore] = useState(null)
  const [editHoles, setEditHoles] = useState([])

  useEffect(() => {
    initialize()
  }, [initialize])

  const fetchPending = useCallback(async () => {
    setLoading(true)
    try {
      const response = await getMyPendingScores()
      setPendingList(response.data || [])
    } catch (e) {
      console.error('Failed to load pending scores:', e)
      toast.error('Failed to load pending approvals.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user) {
      fetchPending()
    }
  }, [user, fetchPending])

  const handleApprove = async (id) => {
    setActiveActionId(id)
    setActionType('approve')
    setActionLoading(true)
    try {
      await approvePendingScore(id)
      toast.success('Scorecard approved!')
      setPendingList((prev) => prev.filter((item) => item.id !== id))
    } catch (e) {
      console.error('Approve error:', e)
      const msg = e.response?.data?.detail || 'Failed to approve scorecard.'
      toast.error(msg)
    } finally {
      setActionLoading(false)
      setActiveActionId(null)
      setActionType(null)
    }
  }

  const handleReject = async (id) => {
    setActiveActionId(id)
    setActionType('reject')
    setActionLoading(true)
    try {
      await rejectPendingScore(id)
      toast.success('Scorecard rejected.')
      setPendingList((prev) => prev.filter((item) => item.id !== id))
    } catch (e) {
      console.error('Reject error:', e)
      const msg = e.response?.data?.detail || 'Failed to reject scorecard.'
      toast.error(msg)
    } finally {
      setActionLoading(false)
      setActiveActionId(null)
      setActionType(null)
    }
  }

  const handleStartEdit = (score) => {
    setEditingScore(score)
    // Map backend hole scores to frontend local structure (camelCase properties if needed or keep standard)
    const initialHoles = (score.hole_scores || []).map((h) => ({
      hole: h.hole,
      par: h.par,
      strokeIndex: h.stroke_index || h.strokeIndex,
      shots: h.shots !== undefined ? h.shots : ''
    }))
    setEditHoles(initialHoles)
  }

  const handleCancelEdit = () => {
    setEditingScore(null)
    setEditHoles([])
  }

  const handleHoleChange = (index, field, value) => {
    setEditHoles((prev) =>
      prev.map((h, i) => (i === index ? { ...h, [field]: value } : h))
    )
  }

  // Calculate live Stableford points during inline edits
  const handicap = user?.handicap || 0.0
  const { totalPoints, totalShots } = calculateRoundPoints(
    editHoles.map((h) => ({
      ...h,
      shots: h.shots === '' ? 0 : Number(h.shots)
    })),
    handicap
  )

  const handleSubmitEdit = async () => {
    // Validate fields
    const emptyHoles = editHoles.filter((h) => h.shots === '')
    if (emptyHoles.length > 0) {
      toast.error('Please enter shots for all 18 holes.')
      return
    }

    setActionType('edit')
    setActionLoading(true)
    try {
      const payload = {
        hole_scores: editHoles.map((h) => ({
          hole: h.hole,
          par: h.par,
          stroke_index: h.strokeIndex,
          shots: Number(h.shots)
        }))
      }
      
      await editAndSubmitPending(editingScore.id, payload)
      toast.success('Scorecard updated and submitted!')
      
      // Remove from list and close edit panel
      setPendingList((prev) => prev.filter((item) => item.id !== editingScore.id))
      setEditingScore(null)
      setEditHoles([])
    } catch (e) {
      console.error('Edit submit error:', e)
      const msg = e.response?.data?.detail || 'Failed to submit updated scorecard.'
      toast.error(msg)
    } finally {
      setActionLoading(false)
      setActionType(null)
    }
  }

  return (
    <ProtectedRoute>
      <PageWrapper>
        {/* Back Link */}
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center space-x-2 text-sm text-grey-mid hover:text-black transition-colors mb-4 group cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span className="font-medium">Back to Dashboard</span>
          </Link>

          <h1 className="text-2xl md:text-3.5xl font-bold font-display text-green-dark">
            Pending Approvals
          </h1>
          <p className="text-sm text-grey-mid font-medium mt-1">
            Scores submitted by other players on your behalf. Review, edit, or reject them.
          </p>
        </div>

        {/* LOADING STATE */}
        {loading ? (
          <div className="space-y-4">
            <Skeleton variant="rect" className="h-32 rounded-lg" />
            <Skeleton variant="rect" className="h-32 rounded-lg" />
          </div>
        ) : editingScore ? (
          /* EDIT SUB-VIEW PANEL */
          <div className="space-y-6 animate-fade-in">
            <Card className="bg-off-white border-grey-light p-4 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-black">
                  Editing scorecard submitted by {editingScore.submitted_by_name}
                </h3>
                <p className="text-xs text-grey-mid mt-0.5">
                  Handicap: {handicap.toFixed(1)} · Club: {editingScore.club_name}
                </p>
              </div>
              <Button
                variant="secondary"
                onClick={handleCancelEdit}
                disabled={actionLoading}
                className="h-8 min-h-0 text-xs py-0 px-3 flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </Button>
            </Card>

            {/* Editable scores table */}
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
                  {editHoles.map((holeData, idx) => (
                    <HoleScoreInput
                      key={holeData.hole}
                      holeData={holeData}
                      handicap={handicap}
                      onShotsChange={(val) => handleHoleChange(idx, 'shots', val)}
                      onParChange={(val) => handleHoleChange(idx, 'par', val)}
                      onSiChange={(val) => handleHoleChange(idx, 'strokeIndex', val)}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Running Totals Bar & Submit */}
            <Card className="bg-green-light/10 border-green-mid/20 p-5 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-center md:text-left">
                <p className="text-xs font-semibold text-grey-mid uppercase tracking-wide">
                  Stableford Review
                </p>
                <p className="text-lg md:text-xl font-bold text-black mt-0.5">
                  Total: <span className="numeral-mono">{totalShots}</span> shots ·{' '}
                  <span className="numeral-mono text-green-dark">{totalPoints}</span> pts
                </p>
              </div>

              <div className="flex gap-3 w-full md:w-auto">
                <Button
                  variant="secondary"
                  onClick={handleCancelEdit}
                  disabled={actionLoading}
                  className="flex-1 md:flex-initial h-11 px-5 text-sm"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  loading={actionLoading && actionType === 'edit'}
                  disabled={actionLoading}
                  onClick={handleSubmitEdit}
                  className="flex-1 md:flex-initial px-6 h-11 flex items-center justify-center space-x-2 font-semibold"
                >
                  <CheckSquare className="w-4 h-4" />
                  <span>Submit Scorecard</span>
                </Button>
              </div>
            </Card>
          </div>
        ) : pendingList.length === 0 ? (
          /* EMPTY STATE (Green checkmark) */
          <div className="flex flex-col items-center justify-center text-center p-10 border border-dashed border-grey-light rounded-lg bg-off-white/40 my-6">
            <div className="w-14 h-14 bg-green-light/65 text-green-dark rounded-full flex items-center justify-center text-xl mb-4 shadow-xs">
              ✓
            </div>
            <h3 className="text-base font-bold text-black mb-1">No Pending Approvals</h3>
            <p className="text-xs text-grey-mid max-w-sm">
              You are all clear! There are currently no scorecards awaiting your review.
            </p>
          </div>
        ) : (
          /* PENDING SCORECARDS LIST */
          <div className="space-y-4">
            {pendingList.map((score) => (
              <PendingScoreCard
                key={score.id}
                pendingScore={score}
                onApprove={handleApprove}
                onReject={handleReject}
                onEditSubmit={handleStartEdit}
                isLoading={activeActionId === score.id && actionLoading}
                actionType={activeActionId === score.id ? actionType : null}
              />
            ))}
          </div>
        )}
      </PageWrapper>
    </ProtectedRoute>
  )
}
