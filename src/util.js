/**
 * Codex Router - Shared utilities
 */

/**
 * Generate a unique ID with optional prefix
 */
export function genId(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}
