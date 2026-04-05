import React, { useState, useEffect } from 'react'
import type { Download } from '../../../electron/utils/types'

const fxrk = window.fxrk

export function DownloadsPanel() {
  const [downloads, setDownloads] = useState<Download[]>([])

  useEffect(() => {
    fxrk.downloads.get().then((d: Download[]) => setDownloads(d))
    const unsub = fxrk.downloads.onItem((d: Download) => {
      setDownloads(prev => {
        const idx = prev.findIndex(x => x.id === d.id)
        if (idx >= 0) {
          const updated = [...prev]
          updated[idx] = d
          return updated
        }
        return [d, ...prev]
      })
    })
    return unsub
  }, [])

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
  }

  const formatProgress = (received: number, total: number) =>
    total > 0 ? Math.round((received / total) * 100) : 0

  return (
    <div className="flex flex-col h-full">
      <div className="panel-header">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#ffcc00" strokeWidth="1.5">
          <path d="M6 1v8M3 7l3 3 3-3" strokeLinecap="round"/>
          <path d="M1 11h10" strokeLinecap="round"/>
        </svg>
        <span style={{ color: '#ffcc00' }}>DOWNLOADS</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {downloads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-[#333]">
            <span className="text-xs">No downloads</span>
          </div>
        ) : (
          downloads.map(dl => (
            <div key={dl.id} className="px-3 py-3 border-b border-[#0f0f0f]">
              <div className="flex items-start gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] text-[#e0e0e0] truncate">{dl.filename}</div>
                  <div className="text-[10px] text-[#333] mt-0.5">
                    {dl.state === 'completed' ? (
                      <span className="text-[#00ff41]">✓ Complete</span>
                    ) : dl.state === 'cancelled' ? (
                      <span className="text-[#ff0040]">✕ Cancelled</span>
                    ) : dl.state === 'interrupted' ? (
                      <span className="text-[#ff6600]">⚠ Interrupted</span>
                    ) : (
                      <span className="text-[#ffcc00]">
                        {formatSize(dl.receivedBytes)} / {formatSize(dl.totalBytes)}
                        {dl.totalBytes > 0 && ` (${formatProgress(dl.receivedBytes, dl.totalBytes)}%)`}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-1 shrink-0">
                  {dl.state === 'completed' && (
                    <>
                      <button
                        className="text-[10px] text-[#444] hover:text-[#00ff41] transition-colors p-1"
                        onClick={() => fxrk.downloads.open(dl.savePath)}
                        title="Open file"
                      >
                        Open
                      </button>
                      <button
                        className="text-[10px] text-[#444] hover:text-[#00d9ff] transition-colors p-1"
                        onClick={() => fxrk.downloads.openFolder(dl.savePath)}
                        title="Show in folder"
                      >
                        Folder
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              {dl.state === 'progressing' && dl.totalBytes > 0 && (
                <div className="h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#ffcc00] transition-all duration-300"
                    style={{ width: `${formatProgress(dl.receivedBytes, dl.totalBytes)}%` }}
                  />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
