'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '../../../../../components/auth/ProtectedRoute'
import PageWrapper from '../../../../../components/layout/PageWrapper'
import Card from '../../../../../components/ui/Card'
import Button from '../../../../../components/ui/Button'
import Skeleton from '../../../../../components/ui/Skeleton'
import EmptyState from '../../../../../components/ui/EmptyState'
import useAuthStore from '../../../../../store/useAuthStore'
import { adminGetPlayerScores, adminEditScore } from '../../../../../lib/api'
import { toast } from 'react-hot-toast'
import { ArrowLeft, Edit2, Check, X } from 'lucide-react'

export default function PlayerRoundsDetailPage({ params }) {
  const router = useRouter()
  const { user, isLoading, initialize } = useAuthStore()
  const playerId = params.userId

  // Page States
  const [scores, setScores] = useState([])
  const [loading, setLoading] = useState(true)
  const [playerName, setPlayerName] = useState('')

  // Inline Editing States
  const [editingId, setEditingId] = useState(null)
  const [editRoundNumber, setEditRoundNumber] = useState('')
  const [editGrossShots, setEditGrossShots] = useState('')
  const [editStablefordPoints, setEditStablefordPoints] = useState('')
  const [rowError, setRowError] = useState('')
  const [savingRowId, setSavingRowId] = useState(null)

  // Auth check
  useEffect(() => {
    initialize()
  }, [initialize])

  // Redirect non-admins
  useEffect(() => {
    if (!isLoading && user && !user.is_admin) {
      router.replace('/dashboard')
    }
  }, [user, isLoading, router])

  const fetchPlayerScores = useCallback(async () => {
    setLoading(true)
    try {
      const response = await adminGetPlayerScores(playerId)
      const data = response.data
      const scoreList = data?.scores || data?.items || response.data || []
      setScores(scoreList)

      // Derive player name from first score entry
      if (scoreList.length > 0) {
        const first = scoreList[0]
        const derivedName = first.player_name || first.full_name || (first.user && first.user.full_name) || ''
        setPlayerName(derivedName)
      }
    } catch (e) {
      console.error('Failed to load player scores:', e)
      toast.error('Failed to load player rounds detail.')
    } finally {
      setLoading(false)
    }
  }, [playerId])

  useEffect(() => {
    if (user && user.is_admin) {
      fetchPlayerScores()
    }
  }, [user, fetchPlayerScores])

  // Start inline editing for a score row
  const startEdit = (score) => {
    setEditingId(score.id)
    setEditRoundNumber(score.round_number?.toString() || '')
    setEditGrossShots(score.total_gross?.toString() || score.gross_shots?.toString() || '')
    setEditStablefordPoints(score.total_points?.toString() || score.stableford_points?.toString() || '')
    setRowError('')
  }

  // Cancel inline editing
  const cancelEdit = () => {
    setEditingId(null)
    setEditRoundNumber('')
    setEditGrossShots('')
    setEditStablefordPoints('')
    setRowError('')
  }

  // Save inline edit changes
  const saveEdit = async (score) => {
    const newRoundNum = parseInt(editRoundNumber)
    const newShots = parseInt(editGrossShots)
    const newPoints = parseInt(editStablefordPoints)

    if (isNaN(newRoundNum) || newRoundNum < 1) {
      setRowError('Round number must be at least 1')
      return
    }
    if (editGrossShots.trim() !== '') {
      if (isNaN(newShots) || newShots < 1) {
        setRowError('Shots must be at least 1')
        return
      }
    }
    if (isNaN(newPoints) || newPoints < 0) {
      setRowError('Points must be at least 0')
      return
    }

    setSavingRowId(score.id)
    setRowError('')
    try {
      // gross_shots: send null explicitly when admin cleared the field,
      // or the integer value when provided. null tells the API to clear it.
      const grossShotsPayload = editGrossShots.trim() === '' ? null : newShots

      const payload = {
        gross_shots: grossShotsPayload,
        stableford_points: newPoints
      }

      // Only include round_number if it changed
      if (newRoundNum !== score.round_number) {
        payload.round_number = newRoundNum
      }

      const response = await adminEditScore(score.id, payload)
      const updatedData = response.data

      toast.success('Round updated successfully')

      // Update row values inline
      setScores((prevScores) =>
        prevScores.map((s) =>
          s.id === score.id
            ? {
                ...s,
                round_number: updatedData.round_number ?? newRoundNum,
                gross_shots: updatedData.gross_shots ?? grossShotsPayload,
                total_gross: updatedData.gross_shots ?? grossShotsPayload,
                stableford_points: updatedData.stableford_points ?? newPoints,
                total_points: updatedData.stableford_points ?? newPoints,
                admin_edit_note: updatedData.admin_edit_note || s.admin_edit_note,
                admin_edited_at: updatedData.admin_edited_at || s.admin_edited_at,
                admin_edited_by_name: updatedData.admin_edited_by_name || s.admin_edited_by_name
              }
            : s
        )
      )

      cancelEdit()
    } catch (err) {
      console.error('Failed to save inline edit:', err)
      if (err.response && err.response.status === 409) {
        setRowError(`Player already has a score for Round ${newRoundNum}`)
      } else {
        const msg = err.response?.data?.detail || 'Failed to update score.'
        setRowError(msg)
      }
    } finally {
      setSavingRowId(null)
    }
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
        {/* Back navigation */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center space-x-2 text-sm text-grey-mid hover:text-black transition-colors mb-4 group cursor-pointer bg-transparent border-0 p-0"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span className="font-medium">Back</span>
          </button>

          <h1 className="text-2xl md:text-3.5xl font-bold font-display text-green-dark">
            {playerName ? `${playerName}'s Rounds` : "Player's Rounds"}
          </h1>
          <p className="text-sm text-grey-mid font-medium mt-1">
            Manage and inline-edit any rounds played by this member.
          </p>
        </div>

        {/* Rounds Table */}
        {loading ? (
          <Skeleton variant="rect" className="h-64 w-full rounded-lg" />
        ) : scores.length === 0 ? (
          <EmptyState
            title="No Rounds Found"
            description="This player hasn't recorded any rounds yet."
          />
        ) : (
          <div className="overflow-x-auto border border-grey-light rounded-lg bg-white shadow-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-off-white border-b border-grey-light text-grey-mid uppercase text-[10px] font-bold tracking-wider">
                  <th className="py-3 px-4">Club</th>
                  <th className="py-3 px-4 text-center w-28">Round</th>
                  <th className="py-3 px-4 text-center w-28">Shots</th>
                  <th className="py-3 px-4 text-center w-28">Pts</th>
                  <th className="py-3 px-4 text-center w-28">Actions</th>
                </tr>
              </thead>
              <tbody>
                {scores.map((score) => {
                  const isEditing = editingId === score.id
                  const roundVal = score.round_number || '-'
                  const shotsVal = (score.total_gross ?? score.gross_shots) != null
                    ? (score.total_gross ?? score.gross_shots)
                    : '–'
                  const pointsVal = score.total_points ?? score.stableford_points ?? '-'

                  return (
                    <React.Fragment key={score.id}>
                      <tr className="border-b border-grey-light hover:bg-off-white/20 transition-colors">
                        {/* Club column */}
                        <td className="py-3.5 px-4 text-sm font-semibold text-black">
                          {score.club_name || 'Golf Club'}
                        </td>

                        {/* Round number */}
                        <td className="py-3.5 px-4 text-center">
                          {isEditing ? (
                            <input
                              type="number"
                              min="1"
                              value={editRoundNumber}
                              onChange={(e) => setEditRoundNumber(e.target.value)}
                              className="w-20 bg-white text-black border border-grey-light rounded px-2 py-1 text-center text-xs focus:border-green-dark focus:ring-1 focus:ring-green-dark outline-none h-8"
                            />
                          ) : (
                            <span className="numeral-mono text-sm font-semibold text-black">{roundVal}</span>
                          )}
                        </td>

                        {/* Gross Shots */}
                        <td className="py-3.5 px-4 text-center">
                          {isEditing ? (
                            <input
                              type="number"
                              min="1"
                              value={editGrossShots}
                              onChange={(e) => setEditGrossShots(e.target.value)}
                              className="w-20 bg-white text-black border border-grey-light rounded px-2 py-1 text-center text-xs focus:border-green-dark focus:ring-1 focus:ring-green-dark outline-none h-8"
                            />
                          ) : (
                            <span className="numeral-mono text-sm font-semibold text-black">{shotsVal}</span>
                          )}
                        </td>

                        {/* Stableford Points */}
                        <td className="py-3.5 px-4 text-center">
                          {isEditing ? (
                            <input
                              type="number"
                              min="0"
                              value={editStablefordPoints}
                              onChange={(e) => setEditStablefordPoints(e.target.value)}
                              className="w-20 bg-white text-black border border-grey-light rounded px-2 py-1 text-center text-xs focus:border-green-dark focus:ring-1 focus:ring-green-dark outline-none h-8"
                            />
                          ) : (
                            <span className="numeral-mono text-sm font-bold text-green-dark">{pointsVal}</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-center">
                          {isEditing ? (
                            <div className="flex justify-center items-center space-x-2">
                              <button
                                onClick={() => saveEdit(score)}
                                disabled={savingRowId !== null}
                                className="p-1 rounded bg-green-light hover:bg-green-light/80 text-green-dark transition-colors cursor-pointer flex items-center justify-center h-7 w-7"
                                title="Save"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={cancelEdit}
                                disabled={savingRowId !== null}
                                className="p-1 rounded bg-red-soft/10 hover:bg-red-soft/20 text-red-soft transition-colors cursor-pointer flex items-center justify-center h-7 w-7"
                                title="Cancel"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => startEdit(score)}
                              disabled={editingId !== null}
                              className={`p-1.5 rounded-full hover:bg-off-white text-grey-mid hover:text-green-dark transition-colors cursor-pointer ${
                                editingId !== null ? 'opacity-40 cursor-not-allowed' : ''
                              }`}
                              title="Edit Round"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                      {/* Inline Error Row */}
                      {isEditing && rowError && (
                        <tr>
                          <td colSpan={5} className="bg-red-soft/5 px-4 py-1.5 text-xs text-red-soft border-b border-grey-light font-medium">
                            ⚠️ {rowError}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </PageWrapper>
    </ProtectedRoute>
  )
}
