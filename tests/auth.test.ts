/**
 * FXRK Auth/Encryption Tests
 */

describe('OAuth state generation', () => {
  const { generateState } = require('../electron/utils/encryption')

  it('generates state strings of sufficient length', () => {
    const state = generateState()
    expect(state.length).toBeGreaterThanOrEqual(32)
  })

  it('generates unique states', () => {
    const s1 = generateState()
    const s2 = generateState()
    expect(s1).not.toBe(s2)
  })
})

describe('Credential validation', () => {
  const { isValidUrl, isValidEmail, isValidAppSpecificPassword } = require('../electron/utils/validators')

  it('validates correct URLs', () => {
    expect(isValidUrl('https://github.com')).toBe(true)
    expect(isValidUrl('http://localhost:3000')).toBe(true)
    expect(isValidUrl('not-a-url')).toBe(false)
    expect(isValidUrl('ftp://example.com')).toBe(false)
  })

  it('validates email addresses', () => {
    expect(isValidEmail('user@example.com')).toBe(true)
    expect(isValidEmail('not-an-email')).toBe(false)
    expect(isValidEmail('@nodomain.com')).toBe(false)
  })

  it('validates Apple app-specific passwords', () => {
    expect(isValidAppSpecificPassword('abcd-efgh-ijkl-mnop')).toBe(true)
    expect(isValidAppSpecificPassword('1234-5678-abcd-efgh')).toBe(false) // must be lowercase letters
    expect(isValidAppSpecificPassword('abc-efgh-ijkl-mnop')).toBe(false)  // wrong segment length
    expect(isValidAppSpecificPassword('')).toBe(false)
  })
})
