/**
 * Utility functions for generating unique IDs
 */

/**
 * Generates a unique ID using timestamp and random string
 * Format: {timestamp}-{randomString}
 * Example: "1703123456789-abc123def"
 */
export function generateUniqueId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generates a unique ID with a prefix
 * Format: {prefix}-{timestamp}-{randomString}
 * Example: "resource-1703123456789-abc123def"
 */
export function generateUniqueIdWithPrefix(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generates a unique ID for multi-resource transaction items
 * Format: {timestamp}-{index}-{randomString}
 * Example: "1703123456789-0-abc123def"
 */
export function generateMultiItemId(index: number): string {
  return `${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generates a short unique ID (shorter than the full version)
 * Format: {timestamp}{randomString}
 * Example: "1703123456789abc123def"
 */
export function generateShortId(): string {
  return `${Date.now()}${Math.random().toString(36).substr(2, 6)}`;
}
