'use client'

import { create } from 'zustand'
import {
  saveToken,
  getToken,
  removeToken,
  saveUser,
  getUser,
  removeUser
} from '../lib/auth'

// Zustand store for authentication state management
// TODO(security): Token is stored in localStorage. Use HttpOnly cookies in production.
const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isLoading: true, // starts true until initialize completes

  login: (userData, token) => {
    saveToken(token)
    saveUser(userData)
    set({ user: userData, token, isLoading: false })
  },

  logout: () => {
    removeToken()
    removeUser()
    set({ user: null, token: null, isLoading: false })
    if (typeof window !== 'undefined') {
      window.location.href = '/'
    }
  },

  initialize: () => {
    // Hydrate store from localStorage on client startup
    if (typeof window !== 'undefined') {
      const token = getToken()
      const user = getUser()
      set({ user, token, isLoading: false })
    } else {
      set({ isLoading: false })
    }
  },

  updateUser: (userData) => {
    saveUser(userData)
    set({ user: userData })
  }
}))

export default useAuthStore
