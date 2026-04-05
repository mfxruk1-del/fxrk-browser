import React, { useState, useEffect, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { Bookmark, BookmarkFolder } from '../../../electron/utils/types'

interface BookmarksPanelProps {
  onNavigate: (url: string) => void
}

const fxrk = window.fxrk

export function BookmarksPanel({ onNavigate }: BookmarksPanelProps) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [folders, setFolders] = useState<BookmarkFolder[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)

  const load = useCallback(async () => {
    const [bms, flds] = await Promise.all([
      fxrk.bookmarks.get('default') as Promise<Bookmark[]>,
      fxrk.bookmarks.getFolders('default') as Promise<BookmarkFolder[]>,
    ])
    setBookmarks(bms)
    setFolders(flds)
  }, [])

  useEffect(() => { load() }, [load])

  const deleteBookmark = async (id: string) => {
    await fxrk.bookmarks.delete(id)
    setBookmarks(prev => prev.filter(b => b.id !== id))
  }

  const importBookmarks = async () => {
    const count = await fxrk.bookmarks.importHTML('default') as number
    if (count > 0) {
      await load()
    }
  }

  const filtered = bookmarks.filter(b => {
    if (selectedFolder !== null && b.folderId !== selectedFolder) return false
    if (searchQuery && !b.title.toLowerCase().includes(searchQuery.toLowerCase()) && !b.url.includes(searchQuery)) return false
    return true
  })

  return (
    <div className="flex flex-col h-full">
      <div className="panel-header">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#00ff41" strokeWidth="1.5">
          <path d="M2 1h8v10l-4-3-4 3V1z" strokeLinecap="round"/>
        </svg>
        <span style={{ color: '#00ff41' }}>BOOKMARKS</span>
        <button
          className="ml-auto text-[#333] hover:text-[#00ff41] transition-colors text-[10px]"
          onClick={importBookmarks}
          title="Import bookmarks from HTML file"
        >
          Import
        </button>
      </div>

      {/* Search */}
      <div className="p-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search bookmarks..."
          className="fxrk-input text-[11px]"
        />
      </div>

      {/* Folder tabs */}
      {folders.length > 0 && (
        <div className="flex gap-1 px-2 pb-1 overflow-x-auto scrollbar-none">
          <button
            className={`px-2 py-1 rounded text-[10px] whitespace-nowrap transition-colors ${selectedFolder === null ? 'bg-[#1a1a1a] text-[#00ff41]' : 'text-[#444] hover:text-[#888]'}`}
            onClick={() => setSelectedFolder(null)}
          >
            All
          </button>
          {folders.map(f => (
            <button
              key={f.id}
              className={`px-2 py-1 rounded text-[10px] whitespace-nowrap transition-colors ${selectedFolder === f.id ? 'bg-[#1a1a1a] text-[#00ff41]' : 'text-[#444] hover:text-[#888]'}`}
              onClick={() => setSelectedFolder(f.id)}
            >
              {f.name}
            </button>
          ))}
        </div>
      )}

      {/* Bookmark list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-[#333]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M4 3h16v19l-8-6-8 6V3z"/>
            </svg>
            <span className="text-xs">{searchQuery ? 'No matches' : 'No bookmarks'}</span>
          </div>
        ) : (
          filtered.map(bookmark => (
            <BookmarkItem
              key={bookmark.id}
              bookmark={bookmark}
              onNavigate={onNavigate}
              onDelete={() => deleteBookmark(bookmark.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}

function BookmarkItem({ bookmark, onNavigate, onDelete }: {
  bookmark: Bookmark
  onNavigate: (url: string) => void
  onDelete: () => void
}) {
  return (
    <div className="group flex items-center gap-2 px-3 py-2 hover:bg-[#111] border-b border-[#0f0f0f] cursor-pointer"
      onClick={() => onNavigate(bookmark.url)}
    >
      {bookmark.favicon ? (
        <img src={bookmark.favicon} alt="" className="w-4 h-4 rounded-sm shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
      ) : (
        <div className="w-4 h-4 rounded-sm bg-[#1a1a1a] flex items-center justify-center shrink-0">
          <span className="text-[8px] text-[#444]">{bookmark.title[0]?.toUpperCase()}</span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="text-[11px] text-[#e0e0e0] truncate">{bookmark.title}</div>
        <div className="text-[10px] text-[#333] truncate">{bookmark.url}</div>
      </div>
      <button
        className="opacity-0 group-hover:opacity-100 text-[#333] hover:text-[#ff0040] transition-all p-1"
        onClick={(e) => { e.stopPropagation(); onDelete() }}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M1 1L9 9M9 1L1 9"/>
        </svg>
      </button>
    </div>
  )
}
