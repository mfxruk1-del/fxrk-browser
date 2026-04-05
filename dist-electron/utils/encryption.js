"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deriveKey = deriveKey;
exports.encrypt = encrypt;
exports.decrypt = decrypt;
exports.encryptObject = encryptObject;
exports.decryptObject = decryptObject;
exports.generatePassword = generatePassword;
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
exports.generateState = generateState;
exports.scramble = scramble;
exports.getMachineKey = getMachineKey;
const crypto_js_1 = __importDefault(require("crypto-js"));
const crypto_1 = require("crypto");
// ============================================================
// FXRK Browser - AES-256-GCM Encryption Utilities
// ============================================================
/**
 * Derives a key from a password using PBKDF2
 * Produces a 256-bit key suitable for AES-256
 */
function deriveKey(password, salt) {
    return crypto_js_1.default.PBKDF2(password, salt, {
        keySize: 256 / 32, // 256 bits = 8 words of 32 bits
        iterations: 10000,
        hasher: crypto_js_1.default.algo.SHA256,
    });
}
/**
 * Encrypts plaintext using AES-256-CBC with a derived key
 * Returns base64-encoded ciphertext with embedded salt and IV
 * Format: base64(salt:iv:ciphertext)
 */
function encrypt(plaintext, password) {
    const salt = crypto_js_1.default.lib.WordArray.random(128 / 8); // 16 bytes salt
    const iv = crypto_js_1.default.lib.WordArray.random(128 / 8); // 16 bytes IV
    const key = deriveKey(password, salt.toString());
    const encrypted = crypto_js_1.default.AES.encrypt(plaintext, key, {
        iv,
        mode: crypto_js_1.default.mode.CBC,
        padding: crypto_js_1.default.pad.Pkcs7,
    });
    // Concatenate salt + iv + ciphertext, encode as base64
    const combined = salt.toString() + ':' + iv.toString() + ':' + encrypted.toString();
    return Buffer.from(combined).toString('base64');
}
/**
 * Decrypts base64-encoded ciphertext produced by encrypt()
 * Returns the original plaintext string
 */
function decrypt(cipherBase64, password) {
    const combined = Buffer.from(cipherBase64, 'base64').toString('utf8');
    const parts = combined.split(':');
    if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format');
    }
    const [saltHex, ivHex, ciphertext] = parts;
    const salt = crypto_js_1.default.enc.Hex.parse(saltHex);
    const iv = crypto_js_1.default.enc.Hex.parse(ivHex);
    const key = deriveKey(password, salt.toString());
    const decrypted = crypto_js_1.default.AES.decrypt(ciphertext, key, {
        iv,
        mode: crypto_js_1.default.mode.CBC,
        padding: crypto_js_1.default.pad.Pkcs7,
    });
    return decrypted.toString(crypto_js_1.default.enc.Utf8);
}
/**
 * Encrypts a JavaScript object (serializes to JSON first)
 */
function encryptObject(obj, password) {
    return encrypt(JSON.stringify(obj), password);
}
/**
 * Decrypts to a typed JavaScript object
 */
function decryptObject(cipherBase64, password) {
    const json = decrypt(cipherBase64, password);
    return JSON.parse(json);
}
/**
 * Generates a secure random password of given length
 */
function generatePassword(length = 20) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    const bytes = (0, crypto_1.randomBytes)(length);
    return Array.from(bytes)
        .map(byte => charset[byte % charset.length])
        .join('');
}
/**
 * Hashes a password for verification purposes (one-way)
 */
function hashPassword(password) {
    return (0, crypto_1.createHash)('sha256').update(password).digest('hex');
}
/**
 * Verifies a password against a stored hash
 */
function verifyPassword(password, hash) {
    return hashPassword(password) === hash;
}
/**
 * Generates a secure random token for OAuth state parameter
 */
function generateState() {
    return (0, crypto_1.randomBytes)(32).toString('hex');
}
/**
 * Simple XOR scramble for less sensitive data (session tokens etc)
 * Not a substitute for real encryption - use for obfuscation only
 */
function scramble(text, key) {
    return Array.from(text)
        .map((char, i) => String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(i % key.length)))
        .join('');
}
// App-level encryption key derived from machine ID
// This provides "at rest" protection even without a master password
function getMachineKey() {
    const os = require('os');
    const { platform, arch } = process;
    const hostname = os.hostname();
    return (0, crypto_1.createHash)('sha256')
        .update(`fxrk-browser-${hostname}-${platform}-${arch}`)
        .digest('hex')
        .substring(0, 32);
}
//# sourceMappingURL=encryption.js.map