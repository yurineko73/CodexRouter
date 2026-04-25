/**
 * Codex Router - log tool
 */

const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const currentLevel = LEVELS[process.env.LOG_LEVEL || 'info'] ?? LEVELS.info;
const isDebug = currentLevel <= LEVELS.debug;

function ts() {
  return new Date().toISOString().slice(11, 23);
}

export const log = {
  isDebugEnabled: isDebug,
  debug(...args) { if (currentLevel <= LEVELS.debug) console.log('[' + ts() + '] DBG', ...args); },
  info(...args)  { if (currentLevel <= LEVELS.info)  console.log('[' + ts() + '] INF', ...args); },
  warn(...args)  { if (currentLevel <= LEVELS.warn)  console.warn('[' + ts() + '] WRN', ...args); },
  error(...args) { if (currentLevel <= LEVELS.error) console.error('[' + ts() + '] ERR', ...args); }
};
