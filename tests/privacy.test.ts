/**
 * FXRK Privacy Engine Tests
 */

// Basic utility tests that don't need Electron
describe('URL normalization', () => {
  const { normalizeInput } = require('../electron/utils/validators')

  it('adds https:// to bare domains', () => {
    expect(normalizeInput('google.com')).toBe('https://google.com')
  })

  it('keeps existing https:// URLs unchanged', () => {
    expect(normalizeInput('https://example.com/path')).toBe('https://example.com/path')
  })

  it('converts bare text to DuckDuckGo search', () => {
    const result = normalizeInput('hello world')
    expect(result).toContain('duckduckgo.com')
    expect(result).toContain('hello%20world')
  })

  it('handles fxrk:// internal URLs', () => {
    expect(normalizeInput('fxrk://newtab')).toBe('fxrk://newtab')
  })

  it('handles localhost', () => {
    expect(normalizeInput('localhost:3000')).toBe('http://localhost:3000')
  })
})

describe('Encryption utilities', () => {
  const { encrypt, decrypt, generatePassword, hashPassword, verifyPassword } = require('../electron/utils/encryption')

  it('encrypts and decrypts text', () => {
    const original = 'secret password 123!'
    const key = 'test-key-for-unit-tests'
    const encrypted = encrypt(original, key)

    expect(encrypted).not.toBe(original)
    expect(decrypt(encrypted, key)).toBe(original)
  })

  it('generates passwords of correct length', () => {
    const pwd = generatePassword(24)
    expect(pwd).toHaveLength(24)
  })

  it('generates different passwords each time', () => {
    const p1 = generatePassword()
    const p2 = generatePassword()
    expect(p1).not.toBe(p2)
  })

  it('hashes and verifies passwords', () => {
    const password = 'my-secure-password'
    const hash = hashPassword(password)
    expect(verifyPassword(password, hash)).toBe(true)
    expect(verifyPassword('wrong-password', hash)).toBe(false)
  })

  it('produces different ciphertext for same plaintext (random IV)', () => {
    const text = 'hello world'
    const key = 'testkey'
    const enc1 = encrypt(text, key)
    const enc2 = encrypt(text, key)
    expect(enc1).not.toBe(enc2) // Different IV each time
    // But both decrypt to same value
    expect(decrypt(enc1, key)).toBe(text)
    expect(decrypt(enc2, key)).toBe(text)
  })
})

describe('Domain extraction', () => {
  const { extractDomain } = require('../electron/utils/validators')

  it('extracts hostname from URL', () => {
    expect(extractDomain('https://www.example.com/path?q=1')).toBe('www.example.com')
  })

  it('handles invalid URLs gracefully', () => {
    expect(extractDomain('not a url')).toBe('not a url')
  })
})
