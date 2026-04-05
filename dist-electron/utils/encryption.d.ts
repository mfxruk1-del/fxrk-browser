import CryptoJS from 'crypto-js';
/**
 * Derives a key from a password using PBKDF2
 * Produces a 256-bit key suitable for AES-256
 */
export declare function deriveKey(password: string, salt: string): CryptoJS.lib.WordArray;
/**
 * Encrypts plaintext using AES-256-CBC with a derived key
 * Returns base64-encoded ciphertext with embedded salt and IV
 * Format: base64(salt:iv:ciphertext)
 */
export declare function encrypt(plaintext: string, password: string): string;
/**
 * Decrypts base64-encoded ciphertext produced by encrypt()
 * Returns the original plaintext string
 */
export declare function decrypt(cipherBase64: string, password: string): string;
/**
 * Encrypts a JavaScript object (serializes to JSON first)
 */
export declare function encryptObject<T>(obj: T, password: string): string;
/**
 * Decrypts to a typed JavaScript object
 */
export declare function decryptObject<T>(cipherBase64: string, password: string): T;
/**
 * Generates a secure random password of given length
 */
export declare function generatePassword(length?: number): string;
/**
 * Hashes a password for verification purposes (one-way)
 */
export declare function hashPassword(password: string): string;
/**
 * Verifies a password against a stored hash
 */
export declare function verifyPassword(password: string, hash: string): boolean;
/**
 * Generates a secure random token for OAuth state parameter
 */
export declare function generateState(): string;
/**
 * Simple XOR scramble for less sensitive data (session tokens etc)
 * Not a substitute for real encryption - use for obfuscation only
 */
export declare function scramble(text: string, key: string): string;
export declare function getMachineKey(): string;
