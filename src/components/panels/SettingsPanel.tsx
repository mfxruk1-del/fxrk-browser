import React, { useState, useEffect } from 'react'
import { usePrivacy } from '../../hooks/usePrivacy'
import type { AppSettings } from '../../../electron/utils/types'

const fxrk = window.fxrk

// ============================================================
// SettingsPanel - Full settings organized by category
// ============================================================

export function SettingsPanel() {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [activeSection, setActiveSection] = useState('privacy')
  const { settings: privacySettings, updatePrivacySetting } = usePrivacy()

  useEffect(() => {
    fxrk.settings.get().then((s: AppSettings) => setSettings(s))
  }, [])

  const updateSetting = async (key: keyof AppSettings, value: AppSettings[keyof AppSettings]) => {
    await fxrk.settings.set(key, value)
    setSettings(prev => prev ? { ...prev, [key]: value } : null)
  }

  const sections = [
    { id: 'privacy', label: 'Privacy', icon: '🛡' },
    { id: 'general', label: 'General', icon: '⚙' },
    { id: 'appearance', label: 'Appearance', icon: '🎨' },
    { id: 'search', label: 'Search', icon: '🔍' },
    { id: 'downloads', label: 'Downloads', icon: '📥' },
    { id: 'shortcuts', label: 'Shortcuts', icon: '⌨' },
    { id: 'about', label: 'About', icon: 'ℹ' },
  ]

  return (
    <div className="flex flex-col h-full">
      <div className="panel-header">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#888" strokeWidth="1.5">
          <circle cx="6" cy="6" r="2"/>
          <path d="M6 0v2M6 10v2M0 6h2M10 6h2M1.76 1.76l1.41 1.41M8.83 8.83l1.41 1.41M8.83 3.17l1.41-1.41M1.76 10.24l1.41-1.41" strokeLinecap="round"/>
        </svg>
        <span>SETTINGS</span>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Section nav */}
        <div className="flex flex-col w-28 border-r border-[#111] overflow-y-auto shrink-0">
          {sections.map(s => (
            <button
              key={s.id}
              className={`flex flex-col items-center gap-1 py-3 px-2 text-[10px] transition-colors ${activeSection === s.id ? 'text-[#00ff41] bg-[#111]' : 'text-[#333] hover:text-[#888]'}`}
              onClick={() => setActiveSection(s.id)}
            >
              <span className="text-base">{s.icon}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>

        {/* Section content */}
        <div className="flex-1 overflow-y-auto p-3">
          {activeSection === 'privacy' && privacySettings && (
            <PrivacySection settings={privacySettings} onUpdate={updatePrivacySetting} />
          )}
          {activeSection === 'general' && settings && (
            <GeneralSection settings={settings} onUpdate={updateSetting} />
          )}
          {activeSection === 'appearance' && settings && (
            <AppearanceSection settings={settings} onUpdate={updateSetting} />
          )}
          {activeSection === 'search' && settings && (
            <SearchSection settings={settings} onUpdate={updateSetting} />
          )}
          {activeSection === 'downloads' && settings && (
            <DownloadsSection settings={settings} onUpdate={updateSetting} />
          )}
          {activeSection === 'about' && <AboutSection />}
        </div>
      </div>
    </div>
  )
}

// ── Privacy Section ────────────────────────────────────────

function PrivacySection({ settings, onUpdate }: { settings: ReturnType<typeof usePrivacy>['settings']; onUpdate: ReturnType<typeof usePrivacy>['updatePrivacySetting'] }) {
  if (!settings) return null

  const Row = ({ label, desc, value, onChange }: { label: string; desc?: string; value: boolean; onChange: (v: boolean) => void }) => (
    <div className="flex items-center justify-between py-2 border-b border-[#0f0f0f]">
      <div>
        <div className="text-[11px] text-[#e0e0e0]">{label}</div>
        {desc && <div className="text-[10px] text-[#333]">{desc}</div>}
      </div>
      <label className="fxrk-toggle">
        <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} />
        <span className="fxrk-toggle-slider" />
      </label>
    </div>
  )

  return (
    <div className="flex flex-col gap-0">
      <div className="text-[10px] text-[#333] uppercase tracking-wider mb-2">Privacy Engine</div>
      <Row label="Ad Blocking" desc="Block ads using EasyList" value={settings.adBlockEnabled} onChange={(v) => onUpdate('adBlockEnabled', v)} />
      <Row label="Tracker Blocking" desc="Block analytics & tracking scripts" value={settings.trackerBlockEnabled} onChange={(v) => onUpdate('trackerBlockEnabled', v)} />
      <Row label="Fingerprint Spoofing" desc="Randomize Canvas, WebGL, Audio fingerprints" value={settings.fingerprintSpoof} onChange={(v) => onUpdate('fingerprintSpoof', v)} />
      <Row label="HTTPS-Only Mode" desc="Force HTTPS connections everywhere" value={settings.httpsOnly} onChange={(v) => onUpdate('httpsOnly', v)} />
      <Row label="Clear Cookies on Close" desc="Delete all cookies when browser closes" value={settings.cookieClearOnClose} onChange={(v) => onUpdate('cookieClearOnClose', v)} />

      <div className="mt-4 text-[10px] text-[#333] uppercase tracking-wider mb-2">Cookie Policy</div>
      <div className="flex flex-col gap-1">
        {(['all', 'third-party', 'none'] as const).map(mode => (
          <label key={mode} className="flex items-center gap-2 py-1.5 cursor-pointer">
            <input
              type="radio"
              name="cookieMode"
              checked={settings.cookieBlockMode === mode}
              onChange={() => onUpdate('cookieBlockMode', mode)}
              className="accent-[#00ff41]"
            />
            <span className="text-[11px] text-[#888]">
              {mode === 'all' ? 'Block All Cookies' : mode === 'third-party' ? 'Block Third-Party Cookies' : 'Allow All Cookies'}
            </span>
          </label>
        ))}
      </div>

      <div className="mt-4 text-[10px] text-[#333] uppercase tracking-wider mb-2">DNS over HTTPS</div>
      <select
        value={settings.doHProvider}
        onChange={(e) => onUpdate('doHProvider', e.target.value as typeof settings.doHProvider)}
        className="fxrk-input text-[11px]"
      >
        <option value="system">System DNS (no DoH)</option>
        <option value="cloudflare">Cloudflare (1.1.1.1)</option>
        <option value="google">Google (8.8.8.8)</option>
        <option value="quad9">Quad9 (9.9.9.9)</option>
        <option value="custom">Custom URL</option>
      </select>
    </div>
  )
}

// ── General Section ────────────────────────────────────────

function GeneralSection({ settings, onUpdate }: { settings: AppSettings; onUpdate: (k: keyof AppSettings, v: AppSettings[keyof AppSettings]) => void }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="text-[10px] text-[#333] uppercase tracking-wider">Startup</div>
      <select value={settings.startupBehavior} onChange={(e) => onUpdate('startupBehavior', e.target.value as AppSettings['startupBehavior'])} className="fxrk-input text-[11px]">
        <option value="new-tab">Open New Tab</option>
        <option value="last-session">Restore Last Session</option>
        <option value="homepage">Open Homepage</option>
      </select>
      <div>
        <label className="text-[10px] text-[#444] block mb-1">Homepage URL</label>
        <input type="text" value={settings.homePage} onChange={(e) => onUpdate('homePage', e.target.value)} className="fxrk-input text-[11px]" placeholder="fxrk://newtab" />
      </div>

      <div className="text-[10px] text-[#333] uppercase tracking-wider mt-2">Session</div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={settings.sessionRestore} onChange={(e) => onUpdate('sessionRestore', e.target.checked)} className="accent-[#00ff41]" />
        <span className="text-[11px] text-[#888]">Restore tabs on restart</span>
      </label>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={settings.autoSaveSession} onChange={(e) => onUpdate('autoSaveSession', e.target.checked)} className="accent-[#00ff41]" />
        <span className="text-[11px] text-[#888]">Auto-save session every 5 minutes</span>
      </label>
    </div>
  )
}

// ── Appearance Section ─────────────────────────────────────

function AppearanceSection({ settings, onUpdate }: { settings: AppSettings; onUpdate: (k: keyof AppSettings, v: AppSettings[keyof AppSettings]) => void }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="text-[10px] text-[#333] uppercase tracking-wider">Theme</div>
      <div className="flex gap-2">
        {(['cyberpunk', 'light'] as const).map(theme => (
          <button
            key={theme}
            className={`flex-1 py-2 rounded border text-[11px] transition-colors ${settings.theme === theme ? 'border-[#00ff41] text-[#00ff41] bg-[rgba(0,255,65,0.05)]' : 'border-[#1e1e1e] text-[#444] hover:border-[#2a2a2a]'}`}
            onClick={() => onUpdate('theme', theme)}
          >
            {theme === 'cyberpunk' ? '🟢 Cyberpunk' : '☀️ Light'}
          </button>
        ))}
      </div>

      <div className="text-[10px] text-[#333] uppercase tracking-wider mt-2">Layout</div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={settings.compactMode} onChange={(e) => onUpdate('compactMode', e.target.checked)} className="accent-[#00ff41]" />
        <span className="text-[11px] text-[#888]">Compact mode (smaller UI)</span>
      </label>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={settings.showStatusBar} onChange={(e) => onUpdate('showStatusBar', e.target.checked)} className="accent-[#00ff41]" />
        <span className="text-[11px] text-[#888]">Show status bar</span>
      </label>
    </div>
  )
}

// ── Search Section ─────────────────────────────────────────

function SearchSection({ settings, onUpdate }: { settings: AppSettings; onUpdate: (k: keyof AppSettings, v: AppSettings[keyof AppSettings]) => void }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="text-[10px] text-[#333] uppercase tracking-wider">Default Search Engine</div>
      <select value={settings.defaultSearchEngine} onChange={(e) => onUpdate('defaultSearchEngine', e.target.value as AppSettings['defaultSearchEngine'])} className="fxrk-input text-[11px]">
        <option value="duckduckgo">DuckDuckGo</option>
        <option value="google">Google</option>
        <option value="bing">Bing</option>
        <option value="brave">Brave Search</option>
        <option value="custom">Custom URL</option>
      </select>
      {settings.defaultSearchEngine === 'custom' && (
        <input type="text" value={settings.customSearchUrl} onChange={(e) => onUpdate('customSearchUrl', e.target.value)} className="fxrk-input text-[11px]" placeholder="https://search.example.com?q=%s" />
      )}
    </div>
  )
}

// ── Downloads Section ──────────────────────────────────────

function DownloadsSection({ settings, onUpdate }: { settings: AppSettings; onUpdate: (k: keyof AppSettings, v: AppSettings[keyof AppSettings]) => void }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="text-[10px] text-[#333] uppercase tracking-wider">Download Location</div>
      <input type="text" value={settings.downloadPath} onChange={(e) => onUpdate('downloadPath', e.target.value)} className="fxrk-input text-[11px]" />
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={settings.askDownloadLocation} onChange={(e) => onUpdate('askDownloadLocation', e.target.checked)} className="accent-[#00ff41]" />
        <span className="text-[11px] text-[#888]">Ask where to save each file</span>
      </label>
    </div>
  )
}

// ── About Section ──────────────────────────────────────────

function AboutSection() {
  const [version, setVersion] = useState('...')
  useEffect(() => {
    fxrk.app.getVersion().then((v: string) => setVersion(v))
  }, [])

  return (
    <div className="flex flex-col items-center gap-4 py-6 text-center">
      <div className="text-4xl font-black tracking-[6px] text-[#00ff41]" style={{ textShadow: '0 0 20px rgba(0,255,65,0.4)' }}>
        FXRK
      </div>
      <div>
        <div className="text-[11px] text-[#888]">FXRK Browser v{version}</div>
        <div className="text-[10px] text-[#333] mt-1">Privacy-First Desktop Browser</div>
      </div>
      <div className="text-[10px] text-[#2a2a2a] space-y-1">
        <div>Electron + React + TypeScript</div>
        <div>© 2024 FXRK. All rights reserved.</div>
      </div>
    </div>
  )
}
