'use client'

import React, { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import useAuthStore from '../store/useAuthStore'
import PageWrapper from '../components/layout/PageWrapper'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import { Trophy, PlusSquare, Camera, ArrowRight } from 'lucide-react'

export default function LandingPage() {
  const router = useRouter()
  const { token, isLoading, initialize } = useAuthStore()

  useEffect(() => {
    // Check if token exists on mount
    initialize()
  }, [initialize])

  useEffect(() => {
    // If token exists, auto-redirect to dashboard
    if (!isLoading && token) {
      router.replace('/dashboard')
    }
  }, [token, isLoading, router])

  if (isLoading || token) {
    // Render skeleton page wrapper during auth check / redirect to avoid flash
    return (
      <PageWrapper className="flex flex-col items-center justify-center min-h-[70vh]">
        <div className="w-16 h-16 bg-green-light rounded-full animate-ping mb-4"></div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper className="flex flex-col items-center justify-center min-h-[75vh] py-12 md:py-20">
      {/* Hero Header */}
      <div className="text-center max-w-2xl mx-auto mb-10 md:mb-16">
        <span className="text-5xl md:text-6xl mb-6 inline-block animate-bounce duration-1000">⛳</span>
        <h1 className="text-4xl md:text-6xl font-bold font-display text-green-dark tracking-tight leading-tight mb-4">
          Golf Club Scorer
        </h1>
        <p className="text-lg md:text-xl text-grey-mid font-medium max-w-lg mx-auto">
          Track your game. Own your rank. Scorecards and leaderboards crafted for golf purists.
        </p>
      </div>

      {/* Main Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-md mx-auto mb-16 md:mb-24">
        <Link href="/login" className="flex-1">
          <Button variant="primary" className="w-full text-base font-semibold py-3 h-12 shadow-sm">
            Sign In
          </Button>
        </Link>
        <Link href="/register" className="flex-1">
          <Button variant="outline" className="w-full text-base font-semibold py-3 h-12">
            Create Account
          </Button>
        </Link>
      </div>

      {/* Divider */}
      <div className="w-full border-t border-grey-light mb-16 max-w-xl mx-auto"></div>

      {/* Feature Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mx-auto">
        {/* Card 1: Leaderboard */}
        <Card className="flex flex-col h-full hover:shadow-lg transition-shadow">
          <div className="w-12 h-12 rounded-lg bg-green-light flex items-center justify-center text-green-dark mb-5">
            <Trophy className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-black mb-2">🏆 Leaderboard</h2>
          <p className="text-sm text-grey-mid leading-relaxed">
            Track your club ranking in real time. Compare scores with other club members on our community leaderboards.
          </p>
        </Card>

        {/* Card 2: Scores */}
        <Card className="flex flex-col h-full hover:shadow-lg transition-shadow">
          <div className="w-12 h-12 rounded-lg bg-green-light flex items-center justify-center text-green-dark mb-5">
            <PlusSquare className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-black mb-2">📊 Scores</h2>
          <p className="text-sm text-grey-mid leading-relaxed">
            Submit your rounds hole-by-hole. Stableford points calculate automatically as you input your shots.
          </p>
        </Card>

        {/* Card 3: Scan Card */}
        <Card className="flex flex-col h-full hover:shadow-lg transition-shadow relative overflow-hidden">
          <div className="absolute top-4 right-4">
            {/* Design system badge - rank 1 gold used sparingly */}
            <Badge variant="rank1" className="text-[10px] py-0.5 px-2">Coming Soon</Badge>
          </div>
          <div className="w-12 h-12 rounded-lg bg-grey-light flex items-center justify-center text-grey-mid mb-5">
            <Camera className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-black mb-2">📸 Scan Card</h2>
          <p className="text-sm text-grey-mid leading-relaxed">
            Snap a picture of your paper scorecard. Our built-in scanner will parse and auto-fill your numbers instantly.
          </p>
        </Card>
      </div>
    </PageWrapper>
  )
}
