import React, { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import type { Profile } from '../../../electron/utils/types'

export function AuthPanel() {
  const { accounts, profiles, activeProfileId, disconnectAccount, createProfile, switchProfile, deleteProfile } = useAuth()
  const [newProfileName, setNewProfileName] = useState('')
  const [showNewProfile, setShowNewProfile] = useState(false)

  const handleCreateProfile = async () => {
    if (!newProfileName.trim()) return
    await createProfile(newProfileName.trim())
    setNewProfileName('')
    setShowNewProfile(false)
  }

  const PROFILE_COLORS = ['#00ff41', '#bc13fe', '#00d9ff', '#ff6600', '#ffcc00']

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="panel-header">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#bc13fe" strokeWidth="1.5">
          <circle cx="6" cy="4.5" r="2.5"/>
          <path d="M1.5 11c0-3 2-4.5 4.5-4.5s4.5 1.5 4.5 4.5" strokeLinecap="round"/>
        </svg>
        <span style={{ color: '#bc13fe' }}>ACCOUNTS</span>
      </div>

      {/* Profiles */}
      <div className="p-3 border-b border-[#111]">
        <div className="text-[10px] text-[#333] uppercase tracking-wider mb-2">Profiles</div>
        <div className="flex flex-col gap-1">
          {profiles.map(profile => (
            <div
              key={profile.id}
              className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${activeProfileId === profile.id ? 'bg-[#151515] border border-[#1e1e1e]' : 'hover:bg-[#111]'}`}
              onClick={() => switchProfile(profile.id)}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                style={{ background: `${profile.color}22`, border: `2px solid ${profile.color}44`, color: profile.color }}
              >
                {profile.avatar}
              </div>
              <div className="flex-1">
                <div className="text-[11px] text-[#e0e0e0]">{profile.name}</div>
                {activeProfileId === profile.id && (
                  <div className="text-[9px] text-[#00ff41]">Active</div>
                )}
              </div>
              {profile.id !== 'default' && (
                <button
                  className="text-[#333] hover:text-[#ff0040] transition-colors p-1"
                  onClick={(e) => { e.stopPropagation(); deleteProfile(profile.id) }}
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M1 1L9 9M9 1L1 9"/>
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>

        {showNewProfile ? (
          <div className="flex gap-2 mt-2">
            <input
              type="text"
              value={newProfileName}
              onChange={(e) => setNewProfileName(e.target.value)}
              placeholder="Profile name..."
              className="fxrk-input flex-1 text-[11px]"
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreateProfile() }}
            />
            <button className="fxrk-btn fxrk-btn-primary text-[10px] px-2" onClick={handleCreateProfile}>+</button>
            <button className="fxrk-btn fxrk-btn-secondary text-[10px] px-2" onClick={() => setShowNewProfile(false)}>✕</button>
          </div>
        ) : (
          <button
            className="mt-2 w-full text-[10px] text-[#333] hover:text-[#bc13fe] transition-colors py-1 border border-dashed border-[#1a1a1a] rounded"
            onClick={() => setShowNewProfile(true)}
          >
            + New Profile
          </button>
        )}
      </div>

      {/* Connected Accounts */}
      <div className="p-3">
        <div className="text-[10px] text-[#333] uppercase tracking-wider mb-2">Connected Accounts</div>
        {accounts.length === 0 ? (
          <div className="text-[#333] text-[11px] text-center py-4">
            No accounts connected.<br />
            <span className="text-[10px] text-[#2a2a2a]">OAuth login coming soon</span>
          </div>
        ) : (
          accounts.map(account => (
            <div key={account.id} className="flex items-center gap-2 p-2 hover:bg-[#111] rounded">
              {account.avatarUrl ? (
                <img src={account.avatarUrl} alt="" className="w-8 h-8 rounded-full" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#1a1a1a] flex items-center justify-center text-[#555] text-sm">
                  {account.email[0]?.toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-[11px] text-[#e0e0e0] truncate">{account.displayName}</div>
                <div className="text-[10px] text-[#333] truncate">{account.email}</div>
                <div className="text-[9px] text-[#bc13fe]">{account.provider}</div>
              </div>
              <button
                className="text-[#333] hover:text-[#ff0040] transition-colors p-1"
                onClick={() => disconnectAccount(account.id)}
                title="Disconnect"
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M1 1L9 9M9 1L1 9"/>
                </svg>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
