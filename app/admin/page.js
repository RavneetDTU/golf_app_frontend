'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ProtectedRoute from '../../components/auth/ProtectedRoute'
import PageWrapper from '../../components/layout/PageWrapper'
import AdminStatsBar from '../../components/admin/AdminStatsBar'
import AdminUserRow from '../../components/admin/AdminUserRow'
import AdminClubRow from '../../components/admin/AdminClubRow'
import AdminDisputeRow from '../../components/admin/AdminDisputeRow'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Skeleton from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import useAuthStore from '../../store/useAuthStore'
import {
  adminGetUsers,
  adminUpdateUser,
  adminGetClubs,
  adminUpdateClub,
  adminGetStats,
  adminGetDisputes,
  adminResolveDispute
} from '../../lib/api'
import { toast } from 'react-hot-toast'
import { ArrowLeft, Search, RefreshCw, X } from 'lucide-react'

export default function AdminPage() {
  const router = useRouter()
  const { user, isLoading, initialize } = useAuthStore()

  // Tab State: 'users' | 'clubs' | 'disputes' | 'stats'
  const [activeTab, setActiveTab] = useState('users')

  // Lists & pagination states
  const [users, setUsers] = useState([])
  const [usersPage, setUsersPage] = useState(1)
  const [hasMoreUsers, setHasMoreUsers] = useState(false)
  const [usersSearch, setUsersSearch] = useState('')
  const [loadingUsers, setLoadingUsers] = useState(false)

  const [clubs, setClubs] = useState([])
  const [clubsPage, setClubsPage] = useState(1)
  const [hasMoreClubs, setHasMoreClubs] = useState(false)
  const [loadingClubs, setLoadingClubs] = useState(false)

  const [disputes, setDisputes] = useState([])
  const [disputeFilter, setDisputeFilter] = useState('all') // 'all' | 'open' | 'resolved'
  const [loadingDisputes, setLoadingDisputes] = useState(false)

  const [stats, setStats] = useState({})
  const [loadingStats, setLoadingStats] = useState(false)

  // Modal States
  const [selectedUser, setSelectedUser] = useState(null)
  const [editUserName, setEditUserName] = useState('')
  const [editUserHandicap, setEditUserHandicap] = useState('')
  const [editUserIsActive, setEditUserIsActive] = useState(true)
  const [editUserIsAdmin, setEditUserIsAdmin] = useState(false)

  const [selectedClub, setSelectedClub] = useState(null)
  const [editClubName, setEditClubName] = useState('')
  const [editClubDescription, setEditClubDescription] = useState('')
  const [editClubLocation, setEditClubLocation] = useState('')
  const [editClubIsActive, setEditClubIsActive] = useState(true)

  const [selectedDispute, setSelectedDispute] = useState(null)
  const [disputeResolutionStatus, setDisputeResolutionStatus] = useState('resolved') // 'resolved' | 'dismissed'
  const [disputeResolutionNotes, setDisputeResolutionNotes] = useState('')

  const [saving, setSaving] = useState(false)

  // Auth initialization
  useEffect(() => {
    initialize()
  }, [initialize])

  // Silently redirect non-admin users
  useEffect(() => {
    if (!isLoading && user && !user.is_admin) {
      router.replace('/dashboard')
    }
  }, [user, isLoading, router])

  // --- DATA FETCHING METHODS ---

  const fetchUsers = useCallback(async (pageNum, searchStr = '', append = false) => {
    setLoadingUsers(true)
    try {
      const response = await adminGetUsers(pageNum, searchStr)
      const data = response.data
      const newUsers = data?.users || []
      
      if (append) {
        setUsers((prev) => [...prev, ...newUsers])
      } else {
        setUsers(newUsers)
      }
      setHasMoreUsers(data?.has_more || false)
    } catch (e) {
      console.error('Failed to fetch users:', e)
      toast.error('Failed to load users.')
    } finally {
      setLoadingUsers(false)
    }
  }, [])

  const fetchClubs = useCallback(async (pageNum, append = false) => {
    setLoadingClubs(true)
    try {
      const response = await adminGetClubs(pageNum)
      const data = response.data
      const newClubs = data?.clubs || []

      if (append) {
        setClubs((prev) => [...prev, ...newClubs])
      } else {
        setClubs(newClubs)
      }
      setHasMoreClubs(data?.has_more || false)
    } catch (e) {
      console.error('Failed to fetch clubs:', e)
      toast.error('Failed to load clubs.')
    } finally {
      setLoadingClubs(false)
    }
  }, [])

  const fetchDisputes = useCallback(async (filterVal) => {
    setLoadingDisputes(true)
    try {
      // Backend expects '' (empty string) for all disputes, otherwise the specific filter status
      const statusParam = filterVal === 'all' ? '' : filterVal
      const response = await adminGetDisputes(statusParam)
      setDisputes(response.data || [])
    } catch (e) {
      console.error('Failed to fetch disputes:', e)
      toast.error('Failed to load disputes.')
    } finally {
      setLoadingDisputes(false)
    }
  }, [])

  const fetchStats = useCallback(async () => {
    setLoadingStats(true)
    try {
      const response = await adminGetStats()
      setStats(response.data || {})
    } catch (e) {
      console.error('Failed to fetch stats:', e)
    } finally {
      setLoadingStats(false)
    }
  }, [])

  // Debounced search for Tab 1 (Users)
  useEffect(() => {
    if (!user || !user.is_admin) return
    const debounceTimer = setTimeout(() => {
      setUsersPage(1)
      fetchUsers(1, usersSearch, false)
    }, 300)
    return () => clearTimeout(debounceTimer)
  }, [usersSearch, user, fetchUsers])

  // Initial tab loading logic
  useEffect(() => {
    if (!user || !user.is_admin) return

    if (activeTab === 'clubs') {
      setClubsPage(1)
      fetchClubs(1, false)
    } else if (activeTab === 'disputes') {
      fetchDisputes(disputeFilter)
    } else if (activeTab === 'stats') {
      fetchStats()
    }
  }, [activeTab, disputeFilter, user, fetchClubs, fetchDisputes, fetchStats])

  // Stats auto-refresh every 60 seconds when on the stats tab
  useEffect(() => {
    if (!user || !user.is_admin || activeTab !== 'stats') return
    const statsTimer = setInterval(() => {
      fetchStats()
    }, 60000)
    return () => clearInterval(statsTimer)
  }, [activeTab, user, fetchStats])

  // Load more pagination actions
  const handleLoadMoreUsers = () => {
    const nextPage = usersPage + 1
    setUsersPage(nextPage)
    fetchUsers(nextPage, usersSearch, true)
  }

  const handleLoadMoreClubs = () => {
    const nextPage = clubsPage + 1
    setClubsPage(nextPage)
    fetchClubs(nextPage, true)
  }

  // --- MODAL SUBMIT HANDLERS ---

  // User Save
  const handleEditUserClick = (u) => {
    setSelectedUser(u)
    setEditUserName(u.full_name)
    setEditUserHandicap(u.handicap.toString())
    setEditUserIsActive(u.is_active !== false)
    setEditUserIsAdmin(u.is_admin === true)
  }

  const handleSaveUser = async () => {
    const handicapNum = parseFloat(editUserHandicap)
    if (isNaN(handicapNum) || handicapNum < 0.0 || handicapNum > 54.0) {
      toast.error('Handicap must be a number between 0.0 and 54.0')
      return
    }

    setSaving(true)
    try {
      const payload = {
        full_name: editUserName,
        handicap: handicapNum,
        is_active: editUserIsActive,
        is_admin: editUserIsAdmin
      }
      await adminUpdateUser(selectedUser.id, payload)
      toast.success('User updated successfully!')
      
      // Update inline list state
      setUsers((prev) =>
        prev.map((item) =>
          item.id === selectedUser.id ? { ...item, ...payload } : item
        )
      )
      setSelectedUser(null)
    } catch (e) {
      console.error('Failed to update user:', e)
      toast.error(e.response?.data?.detail || 'Failed to update user.')
    } finally {
      setSaving(false)
    }
  }

  // Club Save
  const handleEditClubClick = (c) => {
    setSelectedClub(c)
    setEditClubName(c.name)
    setEditClubDescription(c.description || '')
    setEditClubLocation(c.location || '')
    setEditClubIsActive(c.is_active !== false)
  }

  const handleSaveClub = async () => {
    if (!editClubName.trim()) {
      toast.error('Club Name is required')
      return
    }

    setSaving(true)
    try {
      const payload = {
        name: editClubName,
        description: editClubDescription || null,
        location: editClubLocation || null,
        is_active: editClubIsActive
      }
      await adminUpdateClub(selectedClub.id, payload)
      toast.success('Club updated successfully!')
      
      // Update inline list state
      setClubs((prev) =>
        prev.map((item) =>
          item.id === selectedClub.id ? { ...item, ...payload } : item
        )
      )
      setSelectedClub(null)
    } catch (e) {
      console.error('Failed to update club:', e)
      toast.error(e.response?.data?.detail || 'Failed to update club.')
    } finally {
      setSaving(false)
    }
  }

  // Dispute Resolve Save
  const handleResolveClick = (d) => {
    setSelectedDispute(d)
    setDisputeResolutionStatus('resolved')
    setDisputeResolutionNotes('')
  }

  const handleConfirmResolution = async () => {
    if (disputeResolutionNotes.trim().length < 10) {
      toast.error('Resolution notes must be at least 10 characters long.')
      return
    }

    setSaving(true)
    try {
      // Support double structure mapping for backend models
      const payload = {
        status: disputeResolutionStatus,
        notes: disputeResolutionNotes,
        resolution_notes: disputeResolutionNotes
      }
      
      await adminResolveDispute(selectedDispute.id, payload)
      toast.success('Dispute resolved!')

      // Update inline list state
      setDisputes((prev) =>
        prev.map((item) =>
          item.id === selectedDispute.id ? { ...item, status: disputeResolutionStatus } : item
        )
      )
      setSelectedDispute(null)
    } catch (e) {
      console.error('Failed to resolve dispute:', e)
      toast.error(e.response?.data?.detail || 'Failed to resolve dispute.')
    } finally {
      setSaving(false)
    }
  }

  // Check auth immediately
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
            Admin Panel
          </h1>
          <p className="text-sm text-grey-mid font-medium mt-1">
            System administration for users, clubs, disputes, and live usage stats.
          </p>
        </div>

        {/* Tab Headers */}
        <div className="flex border-b border-grey-light mb-8 space-x-2 overflow-x-auto pb-1">
          {['users', 'clubs', 'scores', 'disputes', 'stats'].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                if (tab === 'scores') {
                  router.push('/admin/scores')
                } else {
                  setActiveTab(tab)
                }
              }}
              className={`py-2 px-4 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 outline-none whitespace-nowrap cursor-pointer ${
                activeTab === tab
                  ? 'border-green-dark text-green-dark'
                  : 'border-transparent text-grey-mid hover:text-black'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* TAB 1: USERS */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Search Input */}
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-grey-mid" />
              <input
                type="text"
                placeholder="Search name or email..."
                value={usersSearch}
                onChange={(e) => setUsersSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-grey-light bg-white text-black text-sm rounded-[8px] outline-none focus:border-green-dark focus:ring-1 focus:ring-green-dark h-10"
              />
            </div>

            {loadingUsers && users.length === 0 ? (
              <Skeleton variant="rect" className="h-48 w-full rounded-lg" />
            ) : users.length === 0 ? (
              <EmptyState
                title="No Users Found"
                description={usersSearch ? `No registered users match "${usersSearch}".` : 'No users registered.'}
              />
            ) : (
              <div className="overflow-x-auto border border-grey-light rounded-lg bg-white shadow-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-off-white border-b border-grey-light text-grey-mid uppercase text-[10px] font-bold tracking-wider">
                      <th className="py-3 px-4">Name</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4 text-center">Hdcp</th>
                      <th className="py-3 px-4 text-center">Admin</th>
                      <th className="py-3 px-4 text-center">Active</th>
                      <th className="py-3 px-4 text-center w-14">Edit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <AdminUserRow
                        key={u.id}
                        user={u}
                        onEdit={handleEditUserClick}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {hasMoreUsers && !loadingUsers && (
              <div className="flex justify-center pt-2">
                <Button variant="secondary" onClick={handleLoadMoreUsers} className="text-xs h-9 min-h-[36px] px-4">
                  Load More Users
                </Button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CLUBS */}
        {activeTab === 'clubs' && (
          <div className="space-y-6">
            {loadingClubs && clubs.length === 0 ? (
              <Skeleton variant="rect" className="h-48 w-full rounded-lg" />
            ) : clubs.length === 0 ? (
              <EmptyState title="No Clubs" description="No golf clubs exist in the database." />
            ) : (
              <div className="overflow-x-auto border border-grey-light rounded-lg bg-white shadow-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-off-white border-b border-grey-light text-grey-mid uppercase text-[10px] font-bold tracking-wider">
                      <th className="py-3 px-4">Club Name</th>
                      <th className="py-3 px-4">Location</th>
                      <th className="py-3 px-4 text-center">Members</th>
                      <th className="py-3 px-4 text-center">Active</th>
                      <th className="py-3 px-4 text-center w-14">Edit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clubs.map((c) => (
                      <AdminClubRow
                        key={c.id}
                        club={c}
                        onEdit={handleEditClubClick}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {hasMoreClubs && !loadingClubs && (
              <div className="flex justify-center pt-2">
                <Button variant="secondary" onClick={handleLoadMoreClubs} className="text-xs h-9 min-h-[36px] px-4">
                  Load More Clubs
                </Button>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: DISPUTES */}
        {activeTab === 'disputes' && (
          <div className="space-y-6">
            {/* Filter controls */}
            <div className="flex items-center space-x-2">
              <label className="text-xs font-semibold text-grey-mid uppercase tracking-wide">
                Filter Status:
              </label>
              <select
                value={disputeFilter}
                onChange={(e) => setDisputeFilter(e.target.value)}
                className="bg-white text-black border border-grey-light rounded-md px-2.5 py-1.5 text-xs focus:border-green-dark outline-none h-8"
              >
                <option value="all">All</option>
                <option value="open">Open</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>

            {loadingDisputes && disputes.length === 0 ? (
              <Skeleton variant="rect" className="h-48 w-full rounded-lg" />
            ) : disputes.length === 0 ? (
              <EmptyState title="No Disputes" description={`No disputes found with status "${disputeFilter}".`} />
            ) : (
              <div className="overflow-x-auto border border-grey-light rounded-lg bg-white shadow-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-off-white border-b border-grey-light text-grey-mid uppercase text-[10px] font-bold tracking-wider">
                      <th className="py-3 px-4">Player</th>
                      <th className="py-3 px-4">Raised By</th>
                      <th className="py-3 px-4">Reason</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-center w-24">Resolve</th>
                    </tr>
                  </thead>
                  <tbody>
                    {disputes.map((d) => (
                      <AdminDisputeRow
                        key={d.id}
                        dispute={d}
                        onResolve={handleResolveClick}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: STATS */}
        {activeTab === 'stats' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center pb-2 border-b border-grey-light">
              <h3 className="text-base font-bold text-black">Live Application Stats</h3>
              <Button
                variant="secondary"
                onClick={fetchStats}
                loading={loadingStats}
                className="h-8 min-h-0 text-xs py-0 px-3 flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </Button>
            </div>
            
            {loadingStats && Object.keys(stats).length === 0 ? (
              <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                <Skeleton variant="rect" className="h-20 rounded" />
                <Skeleton variant="rect" className="h-20 rounded" />
                <Skeleton variant="rect" className="h-20 rounded" />
                <Skeleton variant="rect" className="h-20 rounded" />
                <Skeleton variant="rect" className="h-20 rounded" />
                <Skeleton variant="rect" className="h-20 rounded" />
              </div>
            ) : (
              <AdminStatsBar stats={stats} />
            )}
          </div>
        )}

        {/* --- MODAL DIALOGS (Custom framework native React dialogs) --- */}

        {/* Edit User Modal */}
        {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setSelectedUser(null)}></div>
            <Card className="relative w-full max-w-md bg-white shadow-2xl z-10 p-6">
              <div className="flex justify-between items-start mb-6 pb-3 border-b border-grey-light">
                <div>
                  <h3 className="text-base font-bold text-black">Edit User Settings</h3>
                  <p className="text-xs text-grey-mid truncate max-w-[250px]">{selectedUser.email}</p>
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="p-1 rounded-full hover:bg-off-white text-grey-mid cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <Input
                  label="Full Name"
                  value={editUserName}
                  onChange={(e) => setEditUserName(e.target.value)}
                />
                
                <Input
                  label="Handicap"
                  type="number"
                  step="0.1"
                  min="0.0"
                  max="54.0"
                  value={editUserHandicap}
                  onChange={(e) => setEditUserHandicap(e.target.value)}
                />

                <div className="flex items-center space-x-3 py-1.5">
                  <input
                    type="checkbox"
                    id="edit-user-active"
                    checked={editUserIsActive}
                    onChange={(e) => setEditUserIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-green-dark border-grey-light focus:ring-green-dark focus:ring-0"
                  />
                  <label htmlFor="edit-user-active" className="text-xs font-semibold text-black select-none">
                    Account is Active
                  </label>
                </div>

                <div className="flex items-center space-x-3 py-1.5">
                  <input
                    type="checkbox"
                    id="edit-user-admin"
                    checked={editUserIsAdmin}
                    onChange={(e) => setEditUserIsAdmin(e.target.checked)}
                    className="w-4 h-4 rounded text-green-dark border-grey-light focus:ring-green-dark focus:ring-0"
                  />
                  <label htmlFor="edit-user-admin" className="text-xs font-semibold text-black select-none">
                    User has Admin Privileges
                  </label>
                </div>
              </div>

              <div className="mt-8 flex justify-end space-x-3 pt-4 border-t border-grey-light">
                <Button variant="secondary" onClick={() => setSelectedUser(null)} disabled={saving} className="h-9 min-h-0 text-xs px-4">
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleSaveUser} loading={saving} className="h-9 min-h-0 text-xs px-5 font-semibold">
                  Save Changes
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Edit Club Modal */}
        {selectedClub && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setSelectedClub(null)}></div>
            <Card className="relative w-full max-w-md bg-white shadow-2xl z-10 p-6">
              <div className="flex justify-between items-start mb-6 pb-3 border-b border-grey-light">
                <h3 className="text-base font-bold text-black">Edit Club Settings</h3>
                <button
                  onClick={() => setSelectedClub(null)}
                  className="p-1 rounded-full hover:bg-off-white text-grey-mid cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <Input
                  label="Club Name"
                  value={editClubName}
                  onChange={(e) => setEditClubName(e.target.value)}
                />

                <Input
                  label="Location"
                  value={editClubLocation}
                  onChange={(e) => setEditClubLocation(e.target.value)}
                />

                <div>
                  <label className="text-xs font-semibold text-grey-mid uppercase tracking-wider block mb-1.5">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={editClubDescription}
                    onChange={(e) => setEditClubDescription(e.target.value)}
                    className="w-full bg-white text-black border border-grey-light rounded-[8px] px-3.5 py-2.5 text-sm focus:border-green-dark outline-none focus:ring-1 focus:ring-green-dark"
                  />
                </div>

                <div className="flex items-center space-x-3 py-1.5">
                  <input
                    type="checkbox"
                    id="edit-club-active"
                    checked={editClubIsActive}
                    onChange={(e) => setEditClubIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-green-dark border-grey-light focus:ring-green-dark focus:ring-0"
                  />
                  <label htmlFor="edit-club-active" className="text-xs font-semibold text-black select-none">
                    Club is Active
                  </label>
                </div>
              </div>

              <div className="mt-8 flex justify-end space-x-3 pt-4 border-t border-grey-light">
                <Button variant="secondary" onClick={() => setSelectedClub(null)} disabled={saving} className="h-9 min-h-0 text-xs px-4">
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleSaveClub} loading={saving} className="h-9 min-h-0 text-xs px-5 font-semibold">
                  Save Changes
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Dispute Resolution Modal */}
        {selectedDispute && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setSelectedDispute(null)}></div>
            <Card className="relative w-full max-w-md bg-white shadow-2xl z-10 p-6">
              <div className="flex justify-between items-start mb-6 pb-3 border-b border-grey-light">
                <div>
                  <h3 className="text-base font-bold text-black">Resolve Score Dispute</h3>
                  <p className="text-xs text-grey-mid mt-0.5">Player: {selectedDispute.player_name}</p>
                </div>
                <button
                  onClick={() => setSelectedDispute(null)}
                  className="p-1 rounded-full hover:bg-off-white text-grey-mid cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-red-soft/5 border border-red-soft/10 p-3 rounded-lg">
                  <p className="text-[10px] font-bold text-red-500 uppercase tracking-wide">Dispute Reason:</p>
                  <p className="text-xs text-black font-semibold mt-1 italic">{selectedDispute.reason}</p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-grey-mid uppercase tracking-wider block mb-1.5">
                    Resolution Status
                  </label>
                  <select
                    value={disputeResolutionStatus}
                    onChange={(e) => setDisputeResolutionStatus(e.target.value)}
                    className="w-full bg-white text-black border border-grey-light rounded-[8px] px-3.5 py-2.5 text-sm focus:border-green-dark focus:ring-1 focus:ring-green-dark outline-none h-11"
                  >
                    <option value="resolved">Resolved (Make scorecard changes)</option>
                    <option value="dismissed">Dismissed (No scorecard changes)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-grey-mid uppercase tracking-wider block mb-1.5">
                    Resolution Notes (Required, min 10 chars)
                  </label>
                  <textarea
                    rows={4}
                    value={disputeResolutionNotes}
                    onChange={(e) => setDisputeResolutionNotes(e.target.value)}
                    placeholder="Describe how the dispute was settled (e.g. reviewed course logs and scorecard details...)"
                    className="w-full bg-white text-black border border-grey-light rounded-[8px] px-3.5 py-2.5 text-sm focus:border-green-dark outline-none focus:ring-1 focus:ring-green-dark"
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-end space-x-3 pt-4 border-t border-grey-light">
                <Button variant="secondary" onClick={() => setSelectedDispute(null)} disabled={saving} className="h-9 min-h-0 text-xs px-4">
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleConfirmResolution} loading={saving} className="h-9 min-h-0 text-xs px-5 font-semibold">
                  Confirm Resolution
                </Button>
              </div>
            </Card>
          </div>
        )}
      </PageWrapper>
    </ProtectedRoute>
  )
}
