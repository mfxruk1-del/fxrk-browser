// ============================================================
// FXRK Browser - Input Validation Utilities
// ============================================================

/**
 * Validates a URL string — returns true if it is a valid HTTP/HTTPS URL
 */
export function isValidUrl(input: string): boolean {
  try {
    const url = new URL(input)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Normalizes user input — adds https:// if missing, wraps search queries in search URL
 */
export function normalizeInput(input: string, searchEngineTemplate = 'https://duckduckgo.com/?q=%s'): string {
  const trimmed = input.trim()

  if (!trimmed) return 'fxrk://newtab'

  // Already a fxrk:// internal URL
  if (trimmed.startsWith('fxrk://')) return trimmed

  // Has explicit protocol
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      new URL(trimmed)
      return trimmed
    } catch {
      // fall through to search
    }
  }

  // Looks like a domain (e.g., "google.com" or "sub.example.org/path")
  if (/^[a-zA-Z0-9]([a-zA-Z0-9-]*\.)+[a-zA-Z]{2,}(\/.*)?$/.test(trimmed)) {
    return 'https://' + trimmed
  }

  // localhost or IP address
  if (/^localhost(:\d+)?(\/.*)?$/.test(trimmed) || /^\d{1,3}(\.\d{1,3}){3}(:\d+)?(\/.*)?$/.test(trimmed)) {
    return 'http://' + trimmed
  }

  // Treat as search query
  return searchEngineTemplate.replace('%s', encodeURIComponent(trimmed))
}

/**
 * Extracts the domain from a URL
 */
export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

/**
 * Validates an email address
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

/**
 * Validates that a string is a non-empty, non-whitespace string
 */
export function isNonEmpty(value: string): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

/**
 * Sanitizes a filename by removing illegal characters
 */
export function sanitizeFilename(name: string): string {
  return name.replace(/[/\\?%*:|"<>]/g, '-').substring(0, 255)
}

/**
 * Checks if a URL matches an array of glob-style patterns
 * Supports * and ** wildcards
 */
export function matchesPattern(url: string, patterns: string[]): boolean {
  return patterns.some(pattern => {
    const regex = new RegExp('^' + pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*') + '$')
    return regex.test(url)
  })
}

/**
 * Validates Apple ID App-Specific Password format (xxxx-xxxx-xxxx-xxxx)
 */
export function isValidAppSpecificPassword(password: string): boolean {
  return /^[a-z]{4}-[a-z]{4}-[a-z]{4}-[a-z]{4}$/.test(password)
}
