import React, { useState, useEffect } from 'react'
import { DEFAULT_SPEED_DIAL } from '../../../electron/utils/constants'

interface SpeedDialItem {
  id: string
  title: string
  url: string
  favicon: string
}

interface NewTabPageProps {
  onNavigate: (url: string) => void
}

// ============================================================
// NewTabPage - Speed dial grid with clock and search bar
// ============================================================

export function NewTabPage({ onNavigate }: NewTabPageProps) {
  const [time, setTime] = useState(new Date())
  const [search, setSearch] = useState('')
  const [speedDial, setSpeedDial] = useState<SpeedDialItem[]>(DEFAULT_SPEED_DIAL)

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (search.trim()) {
      onNavigate(search.trim())
    }
  }

  const hours = time.getHours().toString().padStart(2, '0')
  const minutes = time.getMinutes().toString().padStart(2, '0')
  const seconds = time.getSeconds().toString().padStart(2, '0')
  const dateStr = time.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })

  return (
    <div className="flex flex-col items-center justify-start min-h-full bg-[#0a0a0a] overflow-y-auto select-none">
      {/* Scanlines overlay */}
      <div className="fixed inset-0 pointer-events-none z-0" style={{
        backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0px, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)'
      }} />

      <div className="relative z-10 flex flex-col items-center gap-8 pt-16 px-8 w-full max-w-4xl">
        {/* Clock */}
        <div className="text-center">
          <div
            className="font-mono font-bold tracking-widest"
            style={{
              fontSize: '72px',
              lineHeight: 1,
              color: '#00ff41',
              textShadow: '0 0 20px rgba(0,255,65,0.4), 0 0 40px rgba(0,255,65,0.1)',
            }}
          >
            {hours}<span className="opacity-50 animate-pulse">:</span>{minutes}
            <span className="opacity-30 text-4xl ml-2">{seconds}</span>
          </div>
          <div className="text-[#333] text-sm font-mono mt-2 tracking-wider">{dateStr}</div>
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="w-full max-w-xl">
          <div className="relative flex items-center">
            <svg className="absolute left-4 text-[#333] pointer-events-none" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="7" cy="7" r="5"/>
              <path d="M11 11l3 3" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search DuckDuckGo or enter URL..."
              className="w-full bg-[#111] border border-[#1e1e1e] rounded-lg pl-11 pr-4 py-3 text-[13px] text-[#e0e0e0] placeholder-[#333] outline-none transition-all focus:border-[#00ff41] focus:shadow-[0_0_0_2px_rgba(0,255,65,0.1)] caret-[#00ff41]"
              autoFocus
            />
          </div>
        </form>

        {/* Speed dial grid */}
        <div className="w-full">
          <div className="text-[10px] text-[#2a2a2a] tracking-[3px] uppercase mb-3 text-center">Quick Access</div>
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
            {speedDial.map((item) => (
              <SpeedDialCard
                key={item.id}
                item={item}
                onClick={() => onNavigate(item.url)}
              />
            ))}
          </div>
        </div>

        {/* FXRK tagline */}
        <div className="mt-auto pb-8 text-center">
          <div className="text-[10px] text-[#1e1e1e] tracking-[4px] uppercase">
            FXRK Browser — Privacy First
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Speed Dial Card ────────────────────────────────────────

function SpeedDialCard({ item, onClick }: { item: SpeedDialItem; onClick: () => void }) {
  const [faviconError, setFaviconError] = useState(false)
  const faviconUrl = item.favicon || `https://www.google.com/s2/favicons?sz=32&domain=${new URL(item.url).hostname}`

  const letter = item.title.charAt(0).toUpperCase()
  const hue = item.url.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % 360

  return (
    <button
      className="group flex flex-col items-center gap-2 p-3 rounded-lg border border-transparent hover:border-[#1e1e1e] hover:bg-[#111] transition-all duration-150"
      onClick={onClick}
    >
      {/* Favicon / Letter fallback */}
      <div className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden"
        style={{ background: faviconError ? `hsl(${hue}, 60%, 15%)` : 'rgba(255,255,255,0.04)' }}>
        {!faviconError ? (
          <img
            src={faviconUrl}
            alt={item.title}
            className="w-6 h-6"
            onError={() => setFaviconError(true)}
          />
        ) : (
          <span className="text-lg font-bold" style={{ color: `hsl(${hue}, 70%, 60%)` }}>{letter}</span>
        )}
      </div>

      {/* Title */}
      <span className="text-[10px] text-[#444] group-hover:text-[#888] transition-colors text-center leading-tight w-full truncate">
        {item.title}
      </span>
    </button>
  )
}
