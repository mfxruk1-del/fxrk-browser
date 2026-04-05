import React, { useState, useEffect, useCallback } from 'react'
import { format, isToday, isYesterday, startOfDay } from 'date-fns'
import type { HistoryEntry } from '../../../electron/utils/types'

interface HistoryPanelProps {
  onNavigate: (url: string) => void
}

const fxrk = window.fxrk

export function HistoryPanel({ onNavigate }: HistoryPanelProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)

  const load = useCallback(async (query?: string) => {
    setLoading(true)
    try {
      const entries = query
        ? await fxrk.history.search('default', query) as HistoryEntry[]
        : await fxrk.history.get('default', 500) as HistoryEntry[]
      setHistory(entries)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const timer = setTimeout(() => load(searchQuery || undefined), 200)
    return () => clearTimeout(timer)
  }, [searchQuery, load])

  const deleteEntry = async (id: string) => {
    await fxrk.history.delete(id)
    setHistory(prev => prev.filter(h => h.id !== id))
  }

  const clearAll = async () => {
    await fxrk.history.clear('default')
    setHistory([])
  }

  // Group history by day
  const groups = groupByDay(history)

  return (
    <div className="flex flex-col h-full">
      <div className="panel-header">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#00d9ff" strokeWidth="1.5">
          <circle cx="6" cy="6" r="5"/>
          <path d="M6 3v3l2 1.5" strokeLinecap="round"/>
        </svg>
        <span style={{ color: '#00d9ff' }}>HISTORY</span>
        <button
          className="ml-auto text-[10px] text-[#333] hover:text-[#ff0040] transition-colors"
          onClick={clearAll}
        >
          Clear All
        </button>
      </div>

      <div className="p-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search history..."
          className="fxrk-input text-[11px]"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-20">
            <div className="fxrk-spinner" />
          </div>
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-[#333]">
            <span className="text-xs">No history</span>
          </div>
        ) : (
          groups.map(group => (
            <div key={group.label}>
              <div className="px-3 py-1.5 text-[9px] text-[#2a2a2a] uppercase tracking-wider bg-[#090909] sticky top-0">
                {group.label}
              </div>
              {group.entries.map(entry => (
                <div
                  key={entry.id}
                  className="group flex items-center gap-2 px-3 py-2 hover:bg-[#111] border-b border-[#0f0f0f] cursor-pointer"
                  onClick={() => onNavigate(entry.url)}
                >
                  {entry.favicon ? (
                    <img src={entry.favicon} alt="" className="w-4 h-4 rounded-sm shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  ) : (
                    <div className="w-4 h-4 bg-[#1a1a1a] rounded-sm shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] text-[#e0e0e0] truncate">{entry.title || entry.url}</div>
                    <div className="text-[10px] text-[#333] truncate">{entry.url}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[9px] text-[#2a2a2a]">
                      {format(new Date(entry.visitedAt), 'HH:mm')}
                    </span>
                    <button
                      className="opacity-0 group-hover:opacity-100 text-[#333] hover:text-[#ff0040] transition-all"
                      onClick={(e) => { e.stopPropagation(); deleteEntry(entry.id) }}
                    >
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M1 1L9 9M9 1L1 9"/>
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function groupByDay(entries: HistoryEntry[]): Array<{ label: string; entries: HistoryEntry[] }> {
  const groups = new Map<string, HistoryEntry[]>()

  for (const entry of entries) {
    const date = new Date(entry.visitedAt)
    let label: string

    if (isToday(date)) label = 'Today'
    else if (isYesterday(date)) label = 'Yesterday'
    else label = format(date, 'EEEE, MMMM d, yyyy')

    if (!groups.has(label)) groups.set(label, [])
    groups.get(label)!.push(entry)
  }

  return Array.from(groups.entries()).map(([label, entries]) => ({ label, entries }))
}
