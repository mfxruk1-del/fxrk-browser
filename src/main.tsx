import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/globals.css'
import type { FXRKApi } from '../electron/preload'

// ============================================================
// FXRK Browser - React Renderer Entry Point
// ============================================================

// TypeScript declaration for window.fxrk (exposed by preload.ts via contextBridge)
declare global {
  interface Window {
    fxrk: FXRKApi
  }
}

// Remove loading screen
const loadingEl = document.getElementById('loading')
if (loadingEl) {
  loadingEl.style.transition = 'opacity 0.3s'
  loadingEl.style.opacity = '0'
  setTimeout(() => loadingEl.remove(), 300)
}

const root = document.getElementById('root')!

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
