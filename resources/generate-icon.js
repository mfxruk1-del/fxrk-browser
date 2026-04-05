/**
 * FXRK Icon Generator
 * Generates icon.ico and icon.png for the app
 * Run: node resources/generate-icon.js
 *
 * The SVG is embedded in this script and saved as PNG via canvas.
 * For production, convert the SVG below using Inkscape or imagemagick:
 *   convert icon.svg -resize 256x256 icon.png
 *   convert icon.png -define icon:auto-resize=256,128,64,48,32,16 icon.ico
 */

const fs = require('fs')
const path = require('path')

// Inline SVG for the FXRK icon
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <rect width="256" height="256" rx="40" fill="#0a0a0a"/>
  <rect x="20" y="20" width="216" height="216" rx="30" fill="none" stroke="#00ff41" stroke-width="4" opacity="0.3"/>

  <!-- F -->
  <rect x="40" y="60" width="16" height="136" fill="#00ff41"/>
  <rect x="40" y="60" width="72" height="16" fill="#00ff41"/>
  <rect x="40" y="120" width="56" height="14" fill="#00ff41"/>

  <!-- X -->
  <rect x="128" y="60" width="88" height="14" rx="4" fill="#bc13fe" transform="rotate(35 172 67)"/>
  <rect x="128" y="182" width="88" height="14" rx="4" fill="#bc13fe" transform="rotate(-35 172 189)"/>

  <!-- Glow effect -->
  <rect x="40" y="60" width="16" height="136" fill="#00ff41" opacity="0.2" filter="url(#glow)"/>
  <filter id="glow">
    <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
    <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>

  <!-- Version dot -->
  <circle cx="220" cy="36" r="12" fill="#bc13fe" opacity="0.8"/>
</svg>`

// Save SVG file so users can convert manually
fs.writeFileSync(path.join(__dirname, 'icon.svg'), svg)
console.log('Generated icon.svg')
console.log('')
console.log('To generate icon.ico and icon.png, install ImageMagick and run:')
console.log('  convert icon.svg -resize 256x256 icon.png')
console.log('  convert icon.png -define icon:auto-resize=256,128,64,48,32,16 icon.ico')
console.log('')
console.log('Or use an online converter at https://convertio.co/svg-ico/')
