import axios from 'axios'
import { toast } from 'react-hot-toast'
import useAuthStore from '../store/useAuthStore'
import { getToken } from './auth'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://103.55.104.142:5030'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request Interceptor: Attach Bearer token from localStorage/auth helper if it exists
api.interceptors.request.use(
  (config) => {
    const token = getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response Interceptor: Handle errors globally based on the project rules
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      // Network error
      toast.error('Connection failed. Check your internet.')
      return Promise.reject(error)
    }

    const { status, data, config } = error.response
    const isAuthRequest = config.url && (config.url.includes('/auth/login') || config.url.includes('/auth/register'))

    switch (status) {
      case 401:
        if (!isAuthRequest) {
          // Clear state + redirect to landing/login
          toast.error('Session expired. Please sign in again.')
          useAuthStore.getState().logout()
        }
        break
      case 403:
        toast.error("You don't have permission to do that.")
        break
      case 409:
        // e.g. "You've already submitted a score for this round."
        toast.error(data?.message || 'A conflict occurred. Please try again.')
        break
      case 422:
        // Do not toast for 422; these are field-level validations handled by the form UI
        break
      default:
        if (status >= 500) {
          toast.error('Something went wrong. Please try again.')
        }
        break
    }

    return Promise.reject(error)
  }
)

// Auth Endpoints
export const registerUser = (data) => api.post('/auth/register', data)
export const loginUser = (data) => api.post('/auth/login', data)
export const getMe = () => api.get('/auth/me')
export const updateProfile = (data) => api.patch('/auth/me', data)

// Clubs Endpoints
export const getClubs = (page = 1) => api.get('/clubs', { params: { page, per_page: 10 } })
export const getClub = (clubId) => api.get(`/clubs/${clubId}`)
export const createClub = (data) => api.post('/clubs', data)
export const joinClub = (clubId) => api.post(`/clubs/${clubId}/join`)
export const leaveClub = (clubId) => api.delete(`/clubs/${clubId}/leave`)

// Games & Scores Endpoints
export const createGame = (data) => api.post('/games', data)
export const submitScore = (gameId, data) => api.post(`/games/${gameId}/scores`, data)
export const getGameScores = (gameId) => api.get(`/games/${gameId}/scores`)
export const getMyScores = (page = 1) => api.get('/scores/my', { params: { page, per_page: 10 } })

// Leaderboard Endpoints
export const getLeaderboard = (clubId, page = 1) =>
  api.get(`/clubs/${clubId}/leaderboard`, { params: { page, per_page: 10 } })
export const getMyRank = (clubId) => api.get(`/clubs/${clubId}/leaderboard/me`)

// Pending scores
export const getMyPendingScores = () => api.get('/pending-scores/mine')
export const approvePendingScore = (id) => api.post(`/pending-scores/${id}/approve`)
export const rejectPendingScore = (id) => api.post(`/pending-scores/${id}/reject`)
export const editAndSubmitPending = (id, data) => api.post(`/pending-scores/${id}/edit-and-submit`, data)

// Disputes
export const raiseDispute = (scoreId, data) => api.post(`/scores/${scoreId}/dispute`, data)
export const getMyDisputes = () => api.get('/disputes/mine')

// Admin
export const adminGetUsers = (page = 1, search = '') =>
  api.get('/admin/users', { params: { page, per_page: 20, search } })
export const adminUpdateUser = (userId, data) => api.patch(`/admin/users/${userId}`, data)
export const adminGetClubs = (page = 1) =>
  api.get('/admin/clubs', { params: { page, per_page: 20 } })
export const adminUpdateClub = (clubId, data) => api.patch(`/admin/clubs/${clubId}`, data)
export const adminGetStats = () => api.get('/admin/stats')
export const adminGetDisputes = (status = '') =>
  api.get('/admin/disputes', { params: { status } })
export const adminResolveDispute = (disputeId, data) =>
  api.post(`/disputes/${disputeId}/resolve`, data)
export const adminUpdateScore = (scoreId, data) => api.patch(`/admin/scores/${scoreId}`, data)

// ─── Admin Score Management ────────────────────────────────────────────────
export const adminListScores = (params = {}) =>
  api.get('/admin/scores', { params })

export const adminAddScore = (data) =>
  api.post('/admin/scores', data)

export const adminEditScore = (scoreId, data) =>
  api.patch(`/admin/scores/${scoreId}`, data)

export const adminDeleteScore = (scoreId, deleteNote) =>
  api.delete(`/admin/scores/${scoreId}`, { data: { delete_note: deleteNote } })

// ─── Quick Scores ──────────────────────────────────────────────────────────
export const submitQuickScore = (data) => api.post('/scores/quick', data)
export const adminGetPlayerScores = (playerId) =>
  api.get('/admin/scores', { params: { player_id: playerId } })

// Sync
export const syncOfflineScores = (items) => api.post('/sync', { items })

export default api
