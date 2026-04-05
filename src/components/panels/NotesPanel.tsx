import React, { useState, useEffect, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { useBrowserStore } from '../../stores/browserStore'
import type { Note } from '../../../electron/utils/types'

const fxrk = window.fxrk

export function NotesPanel() {
  const { tabs, activeTabId } = useBrowserStore()
  const activeTab = tabs.find(t => t.id === activeTabId)
  const [note, setNote] = useState<Note | null>(null)
  const [content, setContent] = useState('')
  const [saved, setSaved] = useState(false)

  const pageUrl = activeTab?.url || ''

  useEffect(() => {
    if (!pageUrl || pageUrl.startsWith('fxrk://')) return
    fxrk.notes.get(pageUrl, 'default').then((n: Note | null) => {
      setNote(n)
      setContent(n?.content || '')
    })
  }, [pageUrl])

  const saveNote = useCallback(async () => {
    if (!pageUrl || pageUrl.startsWith('fxrk://')) return

    const noteData: Note = {
      id: note?.id || uuidv4(),
      url: pageUrl,
      domain: new URL(pageUrl).hostname,
      content,
      createdAt: note?.createdAt || Date.now(),
      updatedAt: Date.now(),
      profileId: 'default',
    }

    await fxrk.notes.save(noteData)
    setNote(noteData)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }, [note, pageUrl, content])

  const deleteNote = useCallback(async () => {
    if (note) {
      await fxrk.notes.delete(note.id)
      setNote(null)
      setContent('')
    }
  }, [note])

  // Auto-save on change
  useEffect(() => {
    if (!content.trim() || !pageUrl || pageUrl.startsWith('fxrk://')) return
    const timer = setTimeout(saveNote, 1500)
    return () => clearTimeout(timer)
  }, [content, saveNote, pageUrl])

  return (
    <div className="flex flex-col h-full">
      <div className="panel-header">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#ffcc00" strokeWidth="1.5">
          <rect x="1" y="1" width="10" height="10" rx="1"/>
          <path d="M3.5 5h5M3.5 7.5h3" strokeLinecap="round"/>
        </svg>
        <span style={{ color: '#ffcc00' }}>PAGE NOTES</span>
        <div className="ml-auto flex items-center gap-2">
          {saved && <span className="text-[#00ff41] text-[10px]">Saved ✓</span>}
          {note && (
            <button
              className="text-[#333] hover:text-[#ff0040] text-[10px] transition-colors"
              onClick={deleteNote}
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Page info */}
      {activeTab && (
        <div className="px-3 py-2 border-b border-[#111]">
          <div className="text-[10px] text-[#444] truncate">{activeTab.title || activeTab.url}</div>
          <div className="text-[9px] text-[#2a2a2a] truncate">{activeTab.url}</div>
        </div>
      )}

      {/* Note editor */}
      <div className="flex-1 flex flex-col p-2">
        {!pageUrl || pageUrl.startsWith('fxrk://') ? (
          <div className="flex items-center justify-center h-full text-[#333] text-xs">
            Navigate to a web page to add notes
          </div>
        ) : (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`Add notes for ${pageUrl ? new URL(pageUrl).hostname : 'this page'}...\n\nNotes are automatically saved and reappear when you visit this page again.`}
            className="flex-1 bg-[#111] border border-[#1a1a1a] rounded p-3 text-[11px] text-[#e0e0e0] placeholder-[#2a2a2a] resize-none outline-none focus:border-[#ffcc00] transition-colors"
          />
        )}
      </div>
    </div>
  )
}
