/**
 * Cross-platform Electron launcher that removes ELECTRON_RUN_AS_NODE
 * before starting Electron. VS Code sets this var which makes the
 * Electron binary behave as plain Node.js (no electron API).
 */
'use strict'
delete process.env.ELECTRON_RUN_AS_NODE
process.env.NODE_ENV = process.env.NODE_ENV || 'development'

const { spawn } = require('child_process')
const electron = require('electron') // returns path to binary

const child = spawn(electron, ['.'], {
  stdio: 'inherit',
  windowsHide: false,
  env: process.env,
})

child.on('close', (code) => process.exit(code ?? 0))
