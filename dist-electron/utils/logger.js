"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const log = __importStar(require("electron-log"));
const path = __importStar(require("path"));
const electron_1 = require("electron");
// ============================================================
// FXRK Browser - Logging Utility
// ============================================================
const userDataPath = electron_1.app?.getPath('userData') || process.env.APPDATA || '.';
// Configure electron-log
log.transports.file.resolvePathFn = () => path.join(userDataPath, 'logs', 'fxrk.log');
log.transports.file.level = 'info';
log.transports.file.maxSize = 5 * 1024 * 1024; // 5MB max log size
log.transports.console.level = process.env.NODE_ENV === 'development' ? 'debug' : 'warn';
log.transports.console.format = '[{level}] {text}';
// FXRK-prefixed logger wrapper
exports.logger = {
    debug: (message, ...args) => log.debug(`[FXRK] ${message}`, ...args),
    info: (message, ...args) => log.info(`[FXRK] ${message}`, ...args),
    warn: (message, ...args) => log.warn(`[FXRK] ${message}`, ...args),
    error: (message, ...args) => log.error(`[FXRK] ${message}`, ...args),
    // Namespaced loggers for subsystems
    browser: {
        debug: (msg, ...a) => log.debug(`[TAB] ${msg}`, ...a),
        info: (msg, ...a) => log.info(`[TAB] ${msg}`, ...a),
        warn: (msg, ...a) => log.warn(`[TAB] ${msg}`, ...a),
        error: (msg, ...a) => log.error(`[TAB] ${msg}`, ...a),
    },
    privacy: {
        debug: (msg, ...a) => log.debug(`[PRIVACY] ${msg}`, ...a),
        info: (msg, ...a) => log.info(`[PRIVACY] ${msg}`, ...a),
        warn: (msg, ...a) => log.warn(`[PRIVACY] ${msg}`, ...a),
        error: (msg, ...a) => log.error(`[PRIVACY] ${msg}`, ...a),
    },
    auth: {
        debug: (msg, ...a) => log.debug(`[AUTH] ${msg}`, ...a),
        info: (msg, ...a) => log.info(`[AUTH] ${msg}`, ...a),
        warn: (msg, ...a) => log.warn(`[AUTH] ${msg}`, ...a),
        error: (msg, ...a) => log.error(`[AUTH] ${msg}`, ...a),
    },
    phone: {
        debug: (msg, ...a) => log.debug(`[PHONE] ${msg}`, ...a),
        info: (msg, ...a) => log.info(`[PHONE] ${msg}`, ...a),
        warn: (msg, ...a) => log.warn(`[PHONE] ${msg}`, ...a),
        error: (msg, ...a) => log.error(`[PHONE] ${msg}`, ...a),
    },
    db: {
        debug: (msg, ...a) => log.debug(`[DB] ${msg}`, ...a),
        info: (msg, ...a) => log.info(`[DB] ${msg}`, ...a),
        warn: (msg, ...a) => log.warn(`[DB] ${msg}`, ...a),
        error: (msg, ...a) => log.error(`[DB] ${msg}`, ...a),
    },
};
exports.default = exports.logger;
//# sourceMappingURL=logger.js.map