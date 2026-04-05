/**
 * Generates a minimal valid icon.ico and icon.png for FXRK Browser
 * Uses pure Node.js Buffer — no external dependencies needed.
 * Run: node resources/make-icon.js
 */
const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

// ── PNG generation ──────────────────────────────────────────────────────────

function makePNG(size) {
  const W = size, H = size
  const pixels = Buffer.alloc(W * H * 4) // RGBA

  // Background: #0a0a0a
  const BG  = [0x0a, 0x0a, 0x0a, 0xff]
  // Green:  #00ff41
  const GRN = [0x00, 0xff, 0x41, 0xff]
  // Purple: #bc13fe
  const PUR = [0xbc, 0x13, 0xfe, 0xff]

  function setPixel(x, y, c) {
    if (x < 0 || x >= W || y < 0 || y >= H) return
    const i = (y * W + x) * 4
    pixels[i] = c[0]; pixels[i+1] = c[1]; pixels[i+2] = c[2]; pixels[i+3] = c[3]
  }

  // Fill background
  for (let i = 0; i < W * H * 4; i += 4) {
    pixels[i] = BG[0]; pixels[i+1] = BG[1]; pixels[i+2] = BG[2]; pixels[i+3] = BG[3]
  }

  const s = size / 32 // scale factor

  // Draw "F" in green (normalized to 32x32 grid)
  function rect(x, y, w, h, c) {
    for (let dy = 0; dy < h; dy++)
      for (let dx = 0; dx < w; dx++)
        setPixel(Math.round(x*s)+dx, Math.round(y*s)+dy, c)
  }

  // F vertical bar
  rect(6, 6, Math.max(2, Math.round(2*s)), Math.round(20*s), GRN)
  // F top bar
  rect(6, 6, Math.round(12*s), Math.max(2, Math.round(2*s)), GRN)
  // F mid bar
  rect(6, 14, Math.round(9*s), Math.max(2, Math.round(2*s)), GRN)

  // X in purple (right half)
  const xOff = Math.round(18*s)
  const xSz  = Math.round(10*s)
  for (let t = 0; t < xSz; t++) {
    const thick = Math.max(1, Math.round(s))
    for (let dt = 0; dt < thick; dt++) {
      // top-left to bottom-right
      setPixel(xOff + t + dt, Math.round(6*s) + t, PUR)
      setPixel(xOff + t,      Math.round(6*s) + t + dt, PUR)
      // top-right to bottom-left
      setPixel(xOff + xSz - 1 - t + dt, Math.round(6*s) + t, PUR)
      setPixel(xOff + xSz - 1 - t,      Math.round(6*s) + t + dt, PUR)
    }
  }

  // Build PNG binary ─────────────────────────────────────────────────────────
  function crc32(buf) {
    const table = (() => {
      const t = new Uint32Array(256)
      for (let i = 0; i < 256; i++) {
        let c = i
        for (let j = 0; j < 8; j++) c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : (c >>> 1)
        t[i] = c
      }
      return t
    })()
    let c = 0xffffffff
    for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
    return (c ^ 0xffffffff) >>> 0
  }

  function chunk(type, data) {
    const typeBytes = Buffer.from(type, 'ascii')
    const lenBuf = Buffer.alloc(4)
    lenBuf.writeUInt32BE(data.length, 0)
    const crcInput = Buffer.concat([typeBytes, data])
    const crcBuf = Buffer.alloc(4)
    crcBuf.writeUInt32BE(crc32(crcInput), 0)
    return Buffer.concat([lenBuf, typeBytes, data, crcBuf])
  }

  // IHDR
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4)
  ihdr[8] = 8; ihdr[9] = 2 // bit depth, color type RGB (we'll do RGBA: type=6)
  ihdr[9] = 6 // RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0

  // IDAT: apply filter byte 0 (None) per scanline
  const rawScanlines = Buffer.alloc(H * (1 + W * 4))
  for (let y = 0; y < H; y++) {
    rawScanlines[y * (1 + W * 4)] = 0 // filter: None
    pixels.copy(rawScanlines, y * (1 + W * 4) + 1, y * W * 4, (y + 1) * W * 4)
  }
  const compressed = zlib.deflateSync(rawScanlines, { level: 9 })

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', compressed), chunk('IEND', Buffer.alloc(0))])
}

// ── ICO generation ───────────────────────────────────────────────────────────

function makeICO(sizes) {
  const pngs = sizes.map(s => makePNG(s))

  // ICONDIR header
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)       // reserved
  header.writeUInt16LE(1, 2)       // type: ICO
  header.writeUInt16LE(sizes.length, 4) // image count

  // ICONDIRENTRY × n (16 bytes each)
  let offset = 6 + 16 * sizes.length
  const entries = []
  for (let i = 0; i < sizes.length; i++) {
    const e = Buffer.alloc(16)
    const sz = sizes[i]
    e[0] = sz >= 256 ? 0 : sz  // width  (0 = 256)
    e[1] = sz >= 256 ? 0 : sz  // height (0 = 256)
    e[2] = 0                   // colorCount
    e[3] = 0                   // reserved
    e.writeUInt16LE(1, 4)      // planes
    e.writeUInt16LE(32, 6)     // bitCount
    e.writeUInt32LE(pngs[i].length, 8)
    e.writeUInt32LE(offset, 12)
    offset += pngs[i].length
    entries.push(e)
  }

  return Buffer.concat([header, ...entries, ...pngs])
}

// ── Write files ───────────────────────────────────────────────────────────────

const dir = __dirname

// icon.png — 256×256
const png256 = makePNG(256)
fs.writeFileSync(path.join(dir, 'icon.png'), png256)
console.log('✓ icon.png (256x256)')

// icon.ico — multi-size (256, 128, 64, 48, 32, 16)
const ico = makeICO([256, 128, 64, 48, 32, 16])
fs.writeFileSync(path.join(dir, 'icon.ico'), ico)
console.log('✓ icon.ico (256/128/64/48/32/16px)')

console.log('\nIcons ready in resources/')
