'use client'

import React, { useState, useRef } from 'react'
import Button from '../ui/Button'
import Card from '../ui/Card'
import ScanPreview from './ScanPreview'
import { scanScorecard } from '../../lib/scanner'
import { Camera, RotateCcw, Play, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function ScanCard({ onScanComplete }) {
  // States: 'idle' | 'preview' | 'scanning' | 'success' | 'error'
  const [scanState, setScanState] = useState('idle')
  const [imageFile, setImageFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const fileInputRef = useRef(null)

  const handleScanClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      setScanState('preview')
    }
  }

  const handleRetake = () => {
    setImageFile(null)
    setPreviewUrl('')
    setErrorMessage('')
    setScanState('idle')
    // Auto-open file picker again
    setTimeout(() => {
      if (fileInputRef.current) {
        fileInputRef.current.click()
      }
    }, 100)
  }

  const handleReadCard = async () => {
    if (!imageFile) return
    setScanState('scanning')
    try {
      const result = await scanScorecard(imageFile)
      if (result.success && result.holes && result.holes.length > 0) {
        setScanState('success')
        toast.success('Scorecard scanned successfully!')
        setTimeout(() => {
          onScanComplete(result.holes)
          setScanState('idle')
          setImageFile(null)
          setPreviewUrl('')
        }, 1500)
      } else {
        setErrorMessage(result.reason || 'Could not parse scorecard. Please try again.')
        setScanState('error')
        toast.error('Failed to parse scorecard.')
      }
    } catch (err) {
      console.error('Scan error:', err)
      setErrorMessage(err.message || 'Connection failed during scanning.')
      setScanState('error')
      toast.error('Scan failed due to a network error.')
    }
  }

  const handleManualEntry = () => {
    setScanState('idle')
    setImageFile(null)
    setPreviewUrl('')
    setErrorMessage('')
  }

  return (
    <Card className="w-full border border-grey-light bg-off-white/20 p-5 md:p-6 mb-6">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
        id="camera-file-input"
      />

      {/* IDLE STATE */}
      {scanState === 'idle' && (
        <div className="flex flex-col items-center text-center py-6">
          <div className="w-14 h-14 rounded-full bg-green-light text-green-dark flex items-center justify-center mb-4 shadow-sm">
            <Camera className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-black mb-1">Scan Scorecard</h3>
          <p className="text-xs text-grey-mid max-w-sm mb-5 font-medium leading-relaxed">
            Take a photo of your physical scorecard with your phone camera or upload a file.
          </p>
          <Button
            variant="primary"
            onClick={handleScanClick}
            className="flex items-center space-x-2 px-6 h-11"
          >
            <Camera className="w-4 h-4" />
            <span>Scan Scorecard</span>
          </Button>
        </div>
      )}

      {/* PREVIEW STATE */}
      {scanState === 'preview' && (
        <div className="flex flex-col items-center text-center space-y-4">
          <ScanPreview imageUrl={previewUrl} isScanning={false} />
          
          <div className="w-full max-w-sm">
            <p className="text-xs text-grey-mid font-medium mb-4">
              Make sure all numbers and text on the scorecard are clearly visible.
            </p>
            <div className="flex gap-4">
              <Button
                variant="secondary"
                onClick={handleRetake}
                className="flex-1 flex items-center justify-center space-x-2 h-11"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Retake</span>
              </Button>
              <Button
                variant="primary"
                onClick={handleReadCard}
                className="flex-1 flex items-center justify-center space-x-2 h-11"
              >
                <Play className="w-4 h-4" />
                <span>Read Card</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* SCANNING STATE */}
      {scanState === 'scanning' && (
        <div className="flex flex-col items-center text-center space-y-4 py-4">
          <ScanPreview imageUrl={previewUrl} isScanning={true} />
          <div className="w-full max-w-sm space-y-2">
            <p className="text-sm font-bold text-green-dark animate-pulse">Reading scorecard...</p>
            <p className="text-xs text-grey-mid font-medium">
              GPT-4 Vision is reading the holes, pars, and scores. This may take a few seconds.
            </p>
          </div>
        </div>
      )}

      {/* SUCCESS STATE */}
      {scanState === 'success' && (
        <div className="flex flex-col items-center text-center py-6 space-y-3">
          <div className="w-14 h-14 rounded-full bg-green-light text-green-dark flex items-center justify-center shadow-sm">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-black">Card Read Successfully!</h3>
          <p className="text-xs text-grey-mid font-medium max-w-xs">
            Hole details have been extracted. Reviewing and prefilling form...
          </p>
        </div>
      )}

      {/* ERROR STATE */}
      {scanState === 'error' && (
        <div className="flex flex-col items-center text-center py-6 space-y-4">
          <div className="w-14 h-14 rounded-full bg-red-soft/10 text-red-500 flex items-center justify-center shadow-sm">
            <XCircle className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-black">Scan Failed</h3>
            <p className="text-xs text-red-500 font-semibold max-w-xs">
              {errorMessage}
            </p>
          </div>
          <div className="w-full max-w-xs flex flex-col items-center gap-3">
            <Button
              variant="primary"
              onClick={handleScanClick}
              className="w-full h-11 flex items-center justify-center space-x-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Try Again</span>
            </Button>
            <button
              onClick={handleManualEntry}
              className="text-xs font-semibold text-green-dark hover:text-green-mid hover:underline"
            >
              Enter Manually
            </button>
          </div>
        </div>
      )}
    </Card>
  )
}
