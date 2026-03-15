'use client'

import React, { useState, useRef } from 'react'
import { Upload, AlertCircle, CheckCircle, Loader } from 'lucide-react'

interface AnalysisResult {
  helmet_detected: boolean
  helmet_confidence: number
  license_plate: string
  plate_detected: boolean
  plate_confidence: number
  image_path?: string
  helmet_message?: string
  error?: string
}

export default function Analyzer() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setError('')

      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()

    const file = e.dataTransfer.files?.[0]
    if (file) {
      setSelectedFile(file)
      setError('')

      const reader = new FileReader()
      reader.onload = (ev) => {
        setPreview(ev.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAnalyze = async () => {
    if (!selectedFile) {
      setError('Please select an image first')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        let errorMsg = 'Failed to analyze image'
        try {
          const errorData = await response.json()
          if (errorData.error) errorMsg = errorData.error
          else if (errorData.detail) errorMsg = errorData.detail
        } catch (_) { }
        throw new Error(errorMsg)
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setSelectedFile(null)
    setPreview('')
    setResult(null)
    setError('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="min-h-screen bg-[#070b14] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))] text-slate-200 p-4 sm:p-6 lg:p-12 font-sans selection:bg-indigo-500/30">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header Options */}
        <div className="text-center space-y-4 pt-8 pb-4">
          <div className="inline-flex items-center justify-center p-2 bg-indigo-500/10 rounded-full mb-2 ring-1 ring-indigo-500/20">
            <span className="bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest mr-2">Core</span>
            <span className="text-indigo-300 text-sm font-medium pr-3">Computer Vision Intelligence</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400 drop-shadow-sm leading-tight">
            Helmet Detection and License Plate Recognition using ML
          </h1>
          <p className="text-slate-400 text-lg md:text-xl max-w-xl mx-auto font-light leading-relaxed">
            AI-driven Vehicle Monitor System and Instant License Plate Tracker.
          </p>
        </div>

        {/* Upload Interface */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6 sm:p-10">
            {!preview ? (
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="relative border-2 border-dashed border-indigo-400/30 rounded-xl p-16 text-center cursor-pointer hover:border-indigo-400/60 hover:bg-white/[0.02] transition-all duration-300 ease-out"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="absolute inset-0 bg-indigo-500/5 hover:bg-indigo-500/10 rounded-xl transition-colors duration-300"></div>
                <div className="relative z-10 flex flex-col items-center">
                  <div className="p-4 bg-indigo-500/20 rounded-full mb-6 ring-1 ring-indigo-500/40">
                    <Upload className="w-8 h-8 text-indigo-300" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">
                    Upload Scan Subject
                  </h3>
                  <p className="text-slate-400 mb-6 font-medium">
                    Drag and drop your footage here, or click to browse files
                  </p>
                  <p className="text-xs text-slate-500 tracking-wider uppercase font-semibold">
                    Accepts JPG, PNG, WEBP • Max 10MB
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="space-y-8">
                <div className="relative rounded-xl overflow-hidden bg-black/50 ring-1 ring-white/10 shadow-inner">
                  <img
                    src={preview}
                    alt="Scan Preview"
                    className="w-full h-auto object-contain max-h-[60vh] opacity-90"
                  />
                  {loading && (
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="relative">
                          <div className="absolute inset-0 bg-indigo-500 rounded-full blur-xl opacity-50 animate-pulse"></div>
                          <Loader className="w-12 h-12 text-indigo-400 animate-spin relative z-10" />
                        </div>
                        <p className="text-indigo-200 font-medium tracking-widest uppercase animate-pulse">Running Neural Analysis...</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={handleAnalyze}
                    disabled={loading}
                    className="flex-1 relative group overflow-hidden bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] disabled:shadow-none flex items-center justify-center gap-3"
                  >
                    {!loading && (
                      <span className="absolute inset-0 w-full h-full -mt-1 rounded-lg opacity-30 bg-gradient-to-b from-transparent via-transparent to-black"></span>
                    )}
                    <span className="relative z-10 flex items-center gap-2 tracking-wide">
                      {loading ? 'Processing...' : 'Initialize Analysis'}
                    </span>
                  </button>
                  <button
                    onClick={handleReset}
                    disabled={loading}
                    className="sm:w-32 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 font-semibold py-4 px-6 rounded-xl ring-1 ring-inset ring-white/10 transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex gap-4 items-start animate-in fade-in slide-in-from-bottom-2">
                <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-red-300 font-bold mb-1">Analysis Failed</h4>
                  <p className="text-red-400/80 text-sm leading-relaxed">{error}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results Section */}
        {result && !loading && (
          <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="border-b border-white/10 bg-slate-800/50 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                <div className="w-2 h-8 bg-indigo-500 rounded-full"></div>
                Diagnostic Report
              </h2>
            </div>

            <div className="p-6 sm:p-10 space-y-8">
              {/* Helmet Status Card */}
              <div className={`relative overflow-hidden rounded-xl p-6 ring-1 ${result.helmet_detected ? 'bg-emerald-500/10 ring-emerald-500/30' : 'bg-rose-500/10 ring-rose-500/30'}`}>
                {/* Background glow */}
                <div className={`absolute -right-20 -top-20 w-64 h-64 rounded-full blur-3xl opacity-20 ${result.helmet_detected ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>

                <div className="relative z-10 flex items-start gap-4">
                  {result.helmet_detected ? (
                    <div className="p-3 bg-emerald-500/20 rounded-full ring-1 ring-emerald-500/50">
                      <CheckCircle className="w-8 h-8 text-emerald-400" />
                    </div>
                  ) : (
                    <div className="p-3 bg-rose-500/20 rounded-full ring-1 ring-rose-500/50">
                      <AlertCircle className="w-8 h-8 text-rose-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2">Safety Compliance</h3>
                    <div className="flex items-center gap-3 mb-1">
                      <span className={`text-lg font-semibold ${result.helmet_detected ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {result.helmet_detected ? 'HELMET DETECTED' : 'VIOLATION: NO HELMET'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-3 text-sm">
                      <div className="flex items-center gap-2 text-slate-400 bg-black/30 px-3 py-1.5 rounded-md">
                        <span className="uppercase text-[10px] font-bold tracking-wider text-slate-500">Confidence</span>
                        <span className="font-mono text-slate-200">{(result.helmet_confidence * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* License Plate Card */}
              {!result.helmet_detected && result.plate_detected && (
                <div className="relative overflow-hidden rounded-xl p-6 bg-amber-500/10 ring-1 ring-amber-500/30">
                  <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full blur-3xl opacity-20 bg-amber-500"></div>

                  <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="p-3 bg-amber-500/20 rounded-full ring-1 ring-amber-500/50">
                        <svg className="w-8 h-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">License Plate Extracted</h3>
                        <p className="text-sm text-slate-400 mt-1">Vehicle identification recorded</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-center sm:items-end gap-2">
                      <div className="bg-yellow-400 text-black px-6 py-3 rounded-lg border-[3px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] font-mono text-2xl font-black tracking-widest transform -rotate-1">
                        {result.license_plate || 'UNKNOWN'}
                      </div>
                      <div className="text-sm flex items-center gap-2 text-slate-400">
                        <span className="uppercase text-[10px] font-bold tracking-wider text-slate-500">AI Confidence</span>
                        <span className="font-mono text-amber-400">{(result.plate_confidence * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!result.helmet_detected && !result.plate_detected && (
                <div className="rounded-xl p-6 bg-slate-800/50 ring-1 ring-white/5 border-l-4 border-slate-500">
                  <p className="text-slate-300 font-medium">
                    No readable license plate was detected in the frame.
                  </p>
                </div>
              )}

              {/* Action */}
              <div className="pt-4">
                <button
                  onClick={handleReset}
                  className="w-full bg-transparent hover:bg-white/5 text-indigo-400 font-bold py-4 px-6 rounded-xl border border-indigo-500/30 hover:border-indigo-400 transition-colors uppercase tracking-widest text-sm"
                >
                  Scan New Target
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
