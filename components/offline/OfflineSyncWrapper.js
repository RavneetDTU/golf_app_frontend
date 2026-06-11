'use client'

import React, { useState, useEffect } from 'react'
import { getPendingScores, deletePendingScore } from '../../lib/offline'
import { syncOfflineScores } from '../../lib/api'
import { toast } from 'react-hot-toast'
import { WifiOff, CloudLightning } from 'lucide-react'

export default function OfflineSyncWrapper({ children }) {
  const [isOnline, setIsOnline] = useState(true)
  const [syncing, setSyncing] = useState(false)

  // Listen to browser network changes
  useEffect(() => {
    if (typeof window === 'undefined') return

    setIsOnline(navigator.onLine)

    const handleOnline = () => {
      setIsOnline(true)
      handleConnectionChange(true)
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleConnectionChange = async (online) => {
    if (online) {
      await syncPendingScores()
    }
  }

  const syncPendingScores = async () => {
    try {
      const items = await getPendingScores()
      if (!items || items.length === 0) return

      setSyncing(true)
      toast.loading('Back online! Syncing your offline scores...', { id: 'offline-sync' })

      // Call API sync endpoint
      // Mapping local objects to what the sync endpoint expects
      const payload = items.map((item) => ({
        club_id: item.club_id,
        played_on: item.played_on,
        course_name: item.course_name,
        tee_colour: item.tee_colour,
        notes: item.notes,
        hole_scores: item.hole_scores,
        handicap_override: item.handicap_override
      }))

      const response = await syncOfflineScores(payload)
      const results = response.data?.results || response.data || []
      
      let successCount = 0
      
      // Look through results and delete successfully synced scores from IndexedDB
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        // Safe check: if response has a status per item, or if the whole request succeeded
        const itemResult = Array.isArray(results) ? results[i] : null
        
        if (!itemResult || itemResult.status === 'created' || itemResult.status === 'updated' || itemResult.status === 'success' || response.status === 200) {
          await deletePendingScore(item.id)
          successCount++
        }
      }

      toast.dismiss('offline-sync')
      if (successCount > 0) {
        toast.success(`${successCount} offline score(s) synced successfully!`)
        // Refresh page data if on dashboard
        if (window.location.pathname === '/dashboard') {
          window.location.reload()
        }
      } else {
        toast.error('Offline scores sync failed or rejected by server.')
      }
    } catch (err) {
      console.error('Failed to sync offline scores:', err)
      toast.dismiss('offline-sync')
      toast.error('Sync failed. Will retry when connection stabilizes.')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <>
      {children}

      {/* Persistent Offline Banner (Yellow/Amber background) */}
      {!isOnline && (
        <div 
          className="fixed bottom-16 md:bottom-0 left-0 right-0 z-50 bg-[#FFF3CD] border-t border-[#FFEEBA] text-[#856404] px-4 py-3 text-xs md:text-sm font-medium flex items-center justify-center space-x-2 shadow-lg transition-transform"
          id="offline-banner"
        >
          <WifiOff className="w-4 h-4 animate-bounce" />
          <span>📡 You&apos;re offline. Scores will sync when you reconnect.</span>
        </div>
      )}
    </>
  )
}
