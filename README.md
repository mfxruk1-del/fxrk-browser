# FXRK Browser

> Privacy-first desktop browser with iPhone integration. Built on Electron + React.

```
███████╗██╗  ██╗██████╗ ██╗  ██╗
██╔════╝╚██╗██╔╝██╔══██╗██║ ██╔╝
█████╗   ╚███╔╝ ██████╔╝█████╔╝
██╔══╝   ██╔██╗ ██╔══██╗██╔═██╗
██║     ██╔╝ ██╗██║  ██║██║  ██╗
╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝
```

## What is FXRK?

FXRK (pronounced "Fork") is a cyberpunk-themed privacy browser built for daily use. It blocks ads and trackers aggressively, spoofs fingerprints, isolates browser sessions, and uniquely integrates with your iPhone via iCloud to receive SMS verification codes automatically.

---

## Features

### Core Browser
- Full Chromium rendering via Electron BrowserView
- Multi-tab with drag-to-reorder, pin tabs, mute tabs
- Smart URL bar (search or navigate)
- Bookmarks with folders, import from Chrome/Firefox HTML
- Full browsing history with search
- Downloads manager
- Find in page (Ctrl+F)
- Per-site zoom memory
- Fullscreen mode (F11)

### Privacy Engine
- **Ad blocking** via EasyList + EasyPrivacy (auto-updated weekly)
- **Tracker blocking** — Google Analytics, Facebook Pixel, Hotjar, 30+ analytics services
- **Cookie control** — block all, block third-party, or allow
- **Fingerprint spoofing** — Canvas, WebGL, AudioContext, Screen resolution, Navigator
- **HTTPS-only mode**
- **DNS over HTTPS** — Cloudflare, Google, Quad9, or custom
- Privacy grade per site (A–F)
- Blocked request counter per tab

### iPhone Integration (iCloud Bridge)
- Connects to iCloud.com/messages via headless Chromium (puppeteer)
- Real-time SMS detection using MutationObserver
- **Auto-detects verification codes** (4-digit, 6-digit, alphanumeric)
- Code notification popup — impossible to miss
- Auto-copies code to clipboard
- **Send Link to Phone** → creates iCloud Note on your iPhone
- **Send Note to Phone** → iCloud Notes sync
- **Clipboard Sync** → push PC clipboard to iPhone, pull from phone
- Two-way messaging reply

### Account Manager
- Encrypted credential storage (AES-256)
- Google OAuth 2.0 login
- Microsoft OAuth 2.0 login
- Custom OAuth providers (GitHub, Discord, Spotify, Reddit, etc.)
- Multiple browser profiles with isolation
- Per-profile bookmarks, history, cookies

### Advanced Features
- Container tabs (Personal/Work/Shopping/Banking — isolated cookie jars)
- User agent spoofer (16 presets + custom, per-site rules, auto-rotate)
- JavaScript toggle (global or per-site)
- Split-screen view
- Reading mode
- Screenshot capture
- Sticky notes per page
- Keyboard shortcuts manager
- Import/export backups (.fxrkbackup)
- Cyberpunk dark theme + light theme option

---

## Installation

### Prerequisites
- Windows 10/11 (64-bit)
- Node.js 18+ (for development) or just the installer for use
- Google Chrome or Microsoft Edge (required for iPhone integration only)

### Development Setup

```bash
# Clone or download
cd fxrk-browser

# Install dependencies
npm install

# Run in development mode
npm run dev
```

### Build Windows Installer

```bash
# Build and package
npm run dist

# Output: release/FXRK Browser Setup.exe
```

---

## iPhone Integration Setup

FXRK uses **iCloud.com** in a hidden browser window to read your SMS messages. This works because iMessages/SMS are synced to iCloud's web interface when you're signed into iCloud on your iPhone.

### Step 1: Generate an App-Specific Password

Apple requires a special password (not your main iCloud password) for apps accessing iCloud:

1. Go to [appleid.apple.com](https://appleid.apple.com)
2. Sign in with your Apple ID
3. Click **Sign-In and Security** → **App-Specific Passwords**
4. Click the **+** button
5. Label it "FXRK Browser"
6. Copy the generated password (format: `xxxx-xxxx-xxxx-xxxx`)

### Step 2: Enable Messages in iCloud

On your iPhone:
1. Go to **Settings** → **[Your Name]** → **iCloud**
2. Make sure **Messages** is toggled ON
3. Wait a few minutes for messages to sync

### Step 3: Connect in FXRK

1. In FXRK, click the **📱 phone icon** in the toolbar or press `Ctrl+Shift+P`
2. Enter your **Apple ID** email
3. Enter your **App-Specific Password** (from Step 1)
4. Click **Connect via iCloud**
5. If prompted for 2FA, enter the code from your iPhone

### How It Works

FXRK launches a hidden Chromium window, signs into iCloud.com, and opens the Messages app. A MutationObserver watches for new messages in real-time. When a verification code is detected, you get a large notification popup and the code is auto-copied to your clipboard.

**SMS message format examples detected:**
- `Your code is 847291`
- `Use 29841 to verify your account`
- `Verification code: ABCD-1234`
- `One-time password: 993847`

---

## Privacy Features Deep Dive

### Ad Blocking
EasyList and EasyPrivacy filter lists are downloaded on first launch and cached locally. They're updated automatically once a week. The blocker intercepts requests at the network level before they load — ads are never downloaded.

### Fingerprint Spoofing
Every browser session FXRK generates fresh random values for:
- **Canvas fingerprint** — adds tiny imperceptible noise to canvas operations
- **WebGL fingerprint** — spoofs vendor (Intel/NVIDIA/AMD) and renderer strings
- **AudioContext fingerprint** — adds noise to oscillator output
- **Screen resolution** — reports a common resolution (1920x1080, 1366x768, etc.)
- **Navigator.plugins** — reports generic minimal plugin list
- **performance.now()** — adds microsecond noise to timing APIs

### Container Tabs
Each container has a completely isolated cookie jar and localStorage. Cookies from your work container cannot be read by your personal container, and vice versa. Assign domains to containers permanently.

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+T` | New Tab |
| `Ctrl+W` | Close Tab |
| `Ctrl+Shift+T` | Reopen Closed Tab |
| `Ctrl+Tab` | Next Tab |
| `Ctrl+Shift+Tab` | Previous Tab |
| `Ctrl+L` | Focus URL Bar |
| `Ctrl+F` | Find in Page |
| `Ctrl+D` | Bookmark Page |
| `Ctrl+B` | Toggle Bookmarks |
| `Ctrl+H` | Toggle History |
| `Ctrl+J` | Toggle Downloads |
| `Ctrl+Shift+P` | Toggle Phone Panel |
| `Ctrl+,` | Settings |
| `F11` | Fullscreen |
| `F12` | DevTools |
| `Ctrl+=` / `Ctrl+-` | Zoom In/Out |
| `Alt+←` / `Alt+→` | Back/Forward |

---

## Project Structure

```
fxrk-browser/
├── electron/               Main process (Node.js)
│   ├── main.ts            App entry point
│   ├── preload.ts         contextBridge API
│   ├── ipc/               IPC handlers
│   │   ├── browser-ipc.ts Tabs, navigation, downloads
│   │   ├── privacy-ipc.ts Privacy settings
│   │   ├── auth-ipc.ts    OAuth, credentials
│   │   ├── phone-ipc.ts   iPhone bridge
│   │   └── settings-ipc.ts App preferences
│   ├── services/          Core services
│   │   ├── DatabaseService.ts   SQLite (encrypted)
│   │   ├── PrivacyEngine.ts     Ad/tracker blocking
│   │   ├── PhoneBridge.ts       iCloud SMS bridge
│   │   ├── AccountManager.ts   OAuth flows
│   │   ├── UserAgentManager.ts UA spoofing
│   │   └── ContainerService.ts  Container isolation
│   └── utils/             Shared utilities
│       ├── types.ts        TypeScript interfaces
│       ├── encryption.ts   AES-256 helpers
│       ├── constants.ts    App constants
│       └── validators.ts   Input validation
├── src/                   Renderer process (React)
│   ├── App.tsx            Root component
│   ├── components/        UI components
│   │   ├── layout/        Window chrome
│   │   ├── browser/       Web content area
│   │   ├── panels/        Sidebar panels
│   │   ├── modals/        Overlays/popups
│   │   └── ui/            Design system
│   ├── stores/            Zustand state
│   ├── hooks/             React hooks
│   └── styles/            CSS/Tailwind
├── resources/             App icons
└── tests/                 Unit tests
```

---

## Troubleshooting

### iPhone Integration Not Connecting

1. **Check Chrome/Edge is installed** — FXRK uses your system browser for the iCloud session
2. **Verify App-Specific Password** — It must be in `xxxx-xxxx-xxxx-xxxx` format (lowercase letters only)
3. **Messages must be enabled in iCloud** — Check iPhone Settings → iCloud → Messages
4. **Try signing out and back in** — Disconnect in FXRK, re-enter credentials

### iCloud Shows "Session Expired"

Your iCloud session cookie expired (usually after 2 weeks). Simply:
1. Open the Phone panel
2. Disconnect
3. Enter your Apple ID and App-Specific Password again
4. Reconnect

### Ad Blocking Not Working on Some Sites

- Some sites use anti-adblock detection. Whitelist them: in the URL bar privacy badge, toggle "Allow Ads on This Site"
- For specific filters, add custom rules in Settings → Privacy → Custom Filters

### Performance Issues

- Disable hardware acceleration in Settings → General if you see rendering glitches
- Fingerprint spoofing adds minimal overhead but can be disabled in Settings → Privacy

---

## Security Notes

- **All passwords and tokens are encrypted** with AES-256 using a machine-specific key derived from your hardware fingerprint
- **No data is ever sent anywhere** — FXRK has zero telemetry
- The iCloud App-Specific Password is stored encrypted locally, never transmitted to FXRK servers (there are none)
- Each container tab uses a completely separate Chromium session partition

---

## Building from Source

```bash
# Install
npm install

# Dev mode (hot reload)
npm run dev

# Production build
npm run build

# Windows installer (.exe)
npm run dist

# Run tests
npm test
```

The installer will be at `release/FXRK Browser Setup X.X.X.exe`.

---

## License

Personal use. All rights reserved.
