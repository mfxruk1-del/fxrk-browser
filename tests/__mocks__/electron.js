// Mock electron module for tests
module.exports = {
  app: {
    getPath: (name) => `/tmp/fxrk-test/${name}`,
    getVersion: () => '1.0.0-test',
  },
  session: { defaultSession: {} },
  ipcMain: { handle: jest.fn(), on: jest.fn() },
  BrowserWindow: jest.fn(),
  BrowserView: jest.fn(),
}
