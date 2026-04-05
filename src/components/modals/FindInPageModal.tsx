import React, { useEffect, useRef, useState } from 'react'
import { useUIStore } from '../../stores/uiStore'
import { useBrowserStore } from '../../stores/browserStore'

const fxrk = window.fxrk

export function FindInPageModal() {
  const { findOpen, setFindOpen } = useUIStore()
  const { activeTabId } = useBrowserStore()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState({ activeMatchOrdinal: 0, matches: 0 })
  const [matchCase, setMatchCase] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (findOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      if (activeTabId) fxrk.find.stop(activeTabId)
      setQuery('')
      setResults({ activeMatchOrdinal: 0, matches: 0 })
    }
  }, [findOpen, activeTabId])

  useEffect(() => {
    const unsub = fxrk.find.onResult((r: { activeMatchOrdinal: number; matches: number }) => {
      setResults(r)
    })
    return unsub
  }, [])

  useEffect(() => {
    if (!query.trim() || !activeTabId) return
    const timer = setTimeout(() => {
      fxrk.find.search(activeTabId, query, { forward: true, matchCase })
    }, 150)
    return () => clearTimeout(timer)
  }, [query, matchCase, activeTabId])

  const handleNext = () => {
    if (activeTabId && query) fxrk.find.search(activeTabId, query, { forward: true, findNext: true, matchCase })
  }

  const handlePrev = () => {
    if (activeTabId && query) fxrk.find.search(activeTabId, query, { forward: false, findNext: true, matchCase })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { setFindOpen(false); return }
    if (e.key === 'Enter') {
      e.shiftKey ? handlePrev() : handleNext()
    }
  }

  if (!findOpen) return null

  return (
    <div
      className="fixed top-24 right-4 z-40 animate-slide-in-right"
      style={{
        background: '#111',
        border: '1px solid #1e1e1e',
        borderRadius: '8px',
        padding: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.8)',
        minWidth: '300px',
      }}
    >
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Find in page..."
        className="flex-1 bg-transparent text-[12px] text-[#e0e0e0] placeholder-[#333] outline-none"
      />

      {/* Match count */}
      {query && (
        <span className="text-[10px] text-[#444] shrink-0">
          {results.matches > 0 ? `${results.activeMatchOrdinal}/${results.matches}` : 'No results'}
        </span>
      )}

      {/* Case sensitivity */}
      <button
        className={`text-[10px] px-1.5 py-0.5 rounded transition-colors ${matchCase ? 'text-[#00ff41] bg-[rgba(0,255,65,0.1)]' : 'text-[#333] hover:text-[#888]'}`}
        onClick={() => setMatchCase(!matchCase)}
        title="Match case"
      >
        Aa
      </button>

      {/* Prev/Next */}
      <button
        className="flex items-center justify-center w-6 h-6 text-[#444] hover:text-[#e0e0e0] transition-colors"
        onClick={handlePrev}
        title="Previous (Shift+Enter)"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M2 6L5 3l3 3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      <button
        className="flex items-center justify-center w-6 h-6 text-[#444] hover:text-[#e0e0e0] transition-colors"
        onClick={handleNext}
        title="Next (Enter)"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M2 4l3 3 3-3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Close */}
      <button
        className="flex items-center justify-center w-6 h-6 text-[#333] hover:text-[#ff0040] transition-colors"
        onClick={() => setFindOpen(false)}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M1 1L9 9M9 1L1 9"/>
        </svg>
      </button>
    </div>
  )
}
