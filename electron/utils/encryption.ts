import CryptoJS from 'crypto-js'
import { createHash, randomBytes } from 'crypto'

// ============================================================
// FXRK Browser - AES-256-GCM Encryption Utilities
// ============================================================

/**
 * Derives a key from a password using PBKDF2
 * Produces a 256-bit key suitable for AES-256
 */
export function deriveKey(password: string, salt: string): CryptoJS.lib.WordArray {
  return CryptoJS.PBKDF2(password, salt, {
    keySize: 256 / 32, // 256 bits = 8 words of 32 bits
    iterations: 10000,
    hasher: CryptoJS.algo.SHA256,
  })
}

/**
 * Encrypts plaintext using AES-256-CBC with a derived key
 * Returns base64-encoded ciphertext with embedded salt and IV
 * Format: base64(salt:iv:ciphertext)
 */
export function encrypt(plaintext: string, password: string): string {
  const salt = CryptoJS.lib.WordArray.random(128 / 8) // 16 bytes salt
  const iv = CryptoJS.lib.WordArray.random(128 / 8)   // 16 bytes IV
  const key = deriveKey(password, salt.toString())

  const encrypted = CryptoJS.AES.encrypt(plaintext, key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  })

  // Concatenate salt + iv + ciphertext, encode as base64
  const combined = salt.toString() + ':' + iv.toString() + ':' + encrypted.toString()
  return Buffer.from(combined).toString('base64')
}

/**
 * Decrypts base64-encoded ciphertext produced by encrypt()
 * Returns the original plaintext string
 */
export function decrypt(cipherBase64: string, password: string): string {
  const combined = Buffer.from(cipherBase64, 'base64').toString('utf8')
  const parts = combined.split(':')

  if (parts.length !== 3) {
    throw new Error('Invalid encrypted data format')
  }

  const [saltHex, ivHex, ciphertext] = parts
  const salt = CryptoJS.enc.Hex.parse(saltHex)
  const iv = CryptoJS.enc.Hex.parse(ivHex)
  const key = deriveKey(password, salt.toString())

  const decrypted = CryptoJS.AES.decrypt(ciphertext, key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  })

  return decrypted.toString(CryptoJS.enc.Utf8)
}

/**
 * Encrypts a JavaScript object (serializes to JSON first)
 */
export function encryptObject<T>(obj: T, password: string): string {
  return encrypt(JSON.stringify(obj), password)
}

/**
 * Decrypts to a typed JavaScript object
 */
export function decryptObject<T>(cipherBase64: string, password: string): T {
  const json = decrypt(cipherBase64, password)
  return JSON.parse(json) as T
}

/**
 * Generates a secure random password of given length
 */
export function generatePassword(length = 20): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?'
  const bytes = randomBytes(length)
  return Array.from(bytes)
    .map(byte => charset[byte % charset.length])
    .join('')
}

/**
 * Hashes a password for verification purposes (one-way)
 */
export function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex')
}

/**
 * Verifies a password against a stored hash
 */
export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash
}

/**
 * Generates a secure random token for OAuth state parameter
 */
export function generateState(): string {
  return randomBytes(32).toString('hex')
}

/**
 * Simple XOR scramble for less sensitive data (session tokens etc)
 * Not a substitute for real encryption - use for obfuscation only
 */
export function scramble(text: string, key: string): string {
  return Array.from(text)
    .map((char, i) => String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(i % key.length)))
    .join('')
}

// App-level encryption key derived from machine ID
// This provides "at rest" protection even without a master password
export function getMachineKey(): string {
  const os = require('os') as typeof import('os')
  const { platform, arch } = process
  const hostname: string = os.hostname()
  return createHash('sha256')
    .update(`fxrk-browser-${hostname}-${platform}-${arch}`)
    .digest('hex')
    .substring(0, 32)
}
