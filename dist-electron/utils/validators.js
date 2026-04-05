"use strict";
// ============================================================
// FXRK Browser - Input Validation Utilities
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidUrl = isValidUrl;
exports.normalizeInput = normalizeInput;
exports.extractDomain = extractDomain;
exports.isValidEmail = isValidEmail;
exports.isNonEmpty = isNonEmpty;
exports.sanitizeFilename = sanitizeFilename;
exports.matchesPattern = matchesPattern;
exports.isValidAppSpecificPassword = isValidAppSpecificPassword;
/**
 * Validates a URL string — returns true if it is a valid HTTP/HTTPS URL
 */
function isValidUrl(input) {
    try {
        const url = new URL(input);
        return url.protocol === 'http:' || url.protocol === 'https:';
    }
    catch {
        return false;
    }
}
/**
 * Normalizes user input — adds https:// if missing, wraps search queries in search URL
 */
function normalizeInput(input, searchEngineTemplate = 'https://duckduckgo.com/?q=%s') {
    const trimmed = input.trim();
    if (!trimmed)
        return 'fxrk://newtab';
    // Already a fxrk:// internal URL
    if (trimmed.startsWith('fxrk://'))
        return trimmed;
    // Has explicit protocol
    if (/^https?:\/\//i.test(trimmed)) {
        try {
            new URL(trimmed);
            return trimmed;
        }
        catch {
            // fall through to search
        }
    }
    // Looks like a domain (e.g., "google.com" or "sub.example.org/path")
    if (/^[a-zA-Z0-9]([a-zA-Z0-9-]*\.)+[a-zA-Z]{2,}(\/.*)?$/.test(trimmed)) {
        return 'https://' + trimmed;
    }
    // localhost or IP address
    if (/^localhost(:\d+)?(\/.*)?$/.test(trimmed) || /^\d{1,3}(\.\d{1,3}){3}(:\d+)?(\/.*)?$/.test(trimmed)) {
        return 'http://' + trimmed;
    }
    // Treat as search query
    return searchEngineTemplate.replace('%s', encodeURIComponent(trimmed));
}
/**
 * Extracts the domain from a URL
 */
function extractDomain(url) {
    try {
        return new URL(url).hostname;
    }
    catch {
        return url;
    }
}
/**
 * Validates an email address
 */
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
/**
 * Validates that a string is a non-empty, non-whitespace string
 */
function isNonEmpty(value) {
    return typeof value === 'string' && value.trim().length > 0;
}
/**
 * Sanitizes a filename by removing illegal characters
 */
function sanitizeFilename(name) {
    return name.replace(/[/\\?%*:|"<>]/g, '-').substring(0, 255);
}
/**
 * Checks if a URL matches an array of glob-style patterns
 * Supports * and ** wildcards
 */
function matchesPattern(url, patterns) {
    return patterns.some(pattern => {
        const regex = new RegExp('^' + pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*') + '$');
        return regex.test(url);
    });
}
/**
 * Validates Apple ID App-Specific Password format (xxxx-xxxx-xxxx-xxxx)
 */
function isValidAppSpecificPassword(password) {
    return /^[a-z]{4}-[a-z]{4}-[a-z]{4}-[a-z]{4}$/.test(password);
}
//# sourceMappingURL=validators.js.map