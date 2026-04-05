/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // FXRK cyberpunk palette
        'fxrk-bg': '#0a0a0a',
        'fxrk-bg-alt': '#111111',
        'fxrk-bg-card': '#141414',
        'fxrk-border': '#1a1a1a',
        'fxrk-green': '#00ff41',
        'fxrk-green-dim': '#00cc33',
        'fxrk-green-glow': 'rgba(0, 255, 65, 0.15)',
        'fxrk-purple': '#bc13fe',
        'fxrk-purple-dim': '#9900cc',
        'fxrk-purple-glow': 'rgba(188, 19, 254, 0.15)',
        'fxrk-cyan': '#00d9ff',
        'fxrk-cyan-dim': '#00aacc',
        'fxrk-cyan-glow': 'rgba(0, 217, 255, 0.15)',
        'fxrk-red': '#ff0040',
        'fxrk-orange': '#ff6600',
        'fxrk-yellow': '#ffff00',
        'fxrk-text': '#e0e0e0',
        'fxrk-text-dim': '#888888',
        'fxrk-text-muted': '#444444',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', 'monospace'],
      },
      fontSize: {
        'xs': ['11px', { lineHeight: '1.4' }],
        'sm': ['12px', { lineHeight: '1.5' }],
        'base': ['13px', { lineHeight: '1.6' }],
        'lg': ['14px', { lineHeight: '1.6' }],
        'xl': ['16px', { lineHeight: '1.5' }],
        '2xl': ['18px', { lineHeight: '1.4' }],
      },
      boxShadow: {
        'glow-green': '0 0 10px rgba(0, 255, 65, 0.3), 0 0 20px rgba(0, 255, 65, 0.1)',
        'glow-purple': '0 0 10px rgba(188, 19, 254, 0.3), 0 0 20px rgba(188, 19, 254, 0.1)',
        'glow-cyan': '0 0 10px rgba(0, 217, 255, 0.3), 0 0 20px rgba(0, 217, 255, 0.1)',
        'glow-red': '0 0 10px rgba(255, 0, 64, 0.3), 0 0 20px rgba(255, 0, 64, 0.1)',
        'panel': '0 0 0 1px rgba(0, 255, 65, 0.1), 0 4px 20px rgba(0, 0, 0, 0.8)',
        'modal': '0 0 0 1px rgba(188, 19, 254, 0.3), 0 8px 40px rgba(0, 0, 0, 0.9)',
      },
      animation: {
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'scanline': 'scanline 8s linear infinite',
        'flicker': 'flicker 0.15s infinite',
        'slide-in-right': 'slide-in-right 0.2s ease-out',
        'slide-in-left': 'slide-in-left 0.2s ease-out',
        'slide-in-up': 'slide-in-up 0.2s ease-out',
        'fade-in': 'fade-in 0.15s ease-out',
        'notification-in': 'notification-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        'scanline': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        'flicker': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.97' },
        },
        'slide-in-right': {
          'from': { transform: 'translateX(100%)', opacity: '0' },
          'to': { transform: 'translateX(0)', opacity: '1' },
        },
        'slide-in-left': {
          'from': { transform: 'translateX(-100%)', opacity: '0' },
          'to': { transform: 'translateX(0)', opacity: '1' },
        },
        'slide-in-up': {
          'from': { transform: 'translateY(20px)', opacity: '0' },
          'to': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          'from': { opacity: '0' },
          'to': { opacity: '1' },
        },
        'notification-in': {
          'from': { transform: 'scale(0.8) translateY(-20px)', opacity: '0' },
          'to': { transform: 'scale(1) translateY(0)', opacity: '1' },
        },
      },
      backdropBlur: {
        'xs': '2px',
      },
    },
  },
  plugins: [],
}
