import * as log from 'electron-log'
import * as path from 'path'
import { app } from 'electron'

// ============================================================
// FXRK Browser - Logging Utility
// ============================================================

const userDataPath = app?.getPath('userData') || process.env.APPDATA || '.'

// Configure electron-log
log.transports.file.resolvePathFn = () =>
  path.join(userDataPath, 'logs', 'fxrk.log')

log.transports.file.level = 'info'
log.transports.file.maxSize = 5 * 1024 * 1024 // 5MB max log size

log.transports.console.level = process.env.NODE_ENV === 'development' ? 'debug' : 'warn'
log.transports.console.format = '[{level}] {text}'

// FXRK-prefixed logger wrapper
export const logger = {
  debug: (message: string, ...args: unknown[]) => log.debug(`[FXRK] ${message}`, ...args),
  info: (message: string, ...args: unknown[]) => log.info(`[FXRK] ${message}`, ...args),
  warn: (message: string, ...args: unknown[]) => log.warn(`[FXRK] ${message}`, ...args),
  error: (message: string, ...args: unknown[]) => log.error(`[FXRK] ${message}`, ...args),

  // Namespaced loggers for subsystems
  browser: {
    debug: (msg: string, ...a: unknown[]) => log.debug(`[TAB] ${msg}`, ...a),
    info: (msg: string, ...a: unknown[]) => log.info(`[TAB] ${msg}`, ...a),
    warn: (msg: string, ...a: unknown[]) => log.warn(`[TAB] ${msg}`, ...a),
    error: (msg: string, ...a: unknown[]) => log.error(`[TAB] ${msg}`, ...a),
  },
  privacy: {
    debug: (msg: string, ...a: unknown[]) => log.debug(`[PRIVACY] ${msg}`, ...a),
    info: (msg: string, ...a: unknown[]) => log.info(`[PRIVACY] ${msg}`, ...a),
    warn: (msg: string, ...a: unknown[]) => log.warn(`[PRIVACY] ${msg}`, ...a),
    error: (msg: string, ...a: unknown[]) => log.error(`[PRIVACY] ${msg}`, ...a),
  },
  auth: {
    debug: (msg: string, ...a: unknown[]) => log.debug(`[AUTH] ${msg}`, ...a),
    info: (msg: string, ...a: unknown[]) => log.info(`[AUTH] ${msg}`, ...a),
    warn: (msg: string, ...a: unknown[]) => log.warn(`[AUTH] ${msg}`, ...a),
    error: (msg: string, ...a: unknown[]) => log.error(`[AUTH] ${msg}`, ...a),
  },
  phone: {
    debug: (msg: string, ...a: unknown[]) => log.debug(`[PHONE] ${msg}`, ...a),
    info: (msg: string, ...a: unknown[]) => log.info(`[PHONE] ${msg}`, ...a),
    warn: (msg: string, ...a: unknown[]) => log.warn(`[PHONE] ${msg}`, ...a),
    error: (msg: string, ...a: unknown[]) => log.error(`[PHONE] ${msg}`, ...a),
  },
  db: {
    debug: (msg: string, ...a: unknown[]) => log.debug(`[DB] ${msg}`, ...a),
    info: (msg: string, ...a: unknown[]) => log.info(`[DB] ${msg}`, ...a),
    warn: (msg: string, ...a: unknown[]) => log.warn(`[DB] ${msg}`, ...a),
    error: (msg: string, ...a: unknown[]) => log.error(`[DB] ${msg}`, ...a),
  },
}

export default logger
