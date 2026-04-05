/**
 * Validates a URL string — returns true if it is a valid HTTP/HTTPS URL
 */
export declare function isValidUrl(input: string): boolean;
/**
 * Normalizes user input — adds https:// if missing, wraps search queries in search URL
 */
export declare function normalizeInput(input: string, searchEngineTemplate?: string): string;
/**
 * Extracts the domain from a URL
 */
export declare function extractDomain(url: string): string;
/**
 * Validates an email address
 */
export declare function isValidEmail(email: string): boolean;
/**
 * Validates that a string is a non-empty, non-whitespace string
 */
export declare function isNonEmpty(value: string): boolean;
/**
 * Sanitizes a filename by removing illegal characters
 */
export declare function sanitizeFilename(name: string): string;
/**
 * Checks if a URL matches an array of glob-style patterns
 * Supports * and ** wildcards
 */
export declare function matchesPattern(url: string, patterns: string[]): boolean;
/**
 * Validates Apple ID App-Specific Password format (xxxx-xxxx-xxxx-xxxx)
 */
export declare function isValidAppSpecificPassword(password: string): boolean;
