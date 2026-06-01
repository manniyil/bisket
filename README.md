# Silk Local — End User Edition

A production-ready desktop application designed for ordinary users who want cleaner, lighter, faster, and more compatible web browsing without understanding browser technology.

## Features

### Core Philosophy
- Clean, elegant, minimal interface
- No technical jargon
- No developer panels
- No console logs
- Looks like Arc Browser, Safari, Notion, or Apple Vision Pro

### Main Capabilities
- **User-Agent Profiles**: Browse websites using different device identities
- **Ad & Tracker Blocking**: Built-in protection, enabled by default
- **Reader Mode**: One-click clean reading experience
- **Site Rules**: Automatically apply profiles to specific websites
- **Performance Mode**: Optional toggle for older PCs

### Pre-installed Profiles
- Desktop Chrome
- Android Phone
- Android Tablet
- iPhone Safari
- iPad Safari
- Android TV
- Smart TV
- Kindle Reader
- Legacy Android
- Low Bandwidth Mode
- Samsung Smart TV
- PlayStation Browser

## Installation

### Prerequisites
- Node.js 18 or later
- npm 8 or later
- At least 2GB free disk space

### Install Dependencies
```bash
npm install
```

### Run Development
```bash
npm start
```

### Build for Production

**Windows:**
```bash
npm run build:win
```

**macOS:**
```bash
npm run build:mac
```

**Linux:**
```bash
npm run build:linux
```

## Usage

### Navigation
- Enter URLs in the address bar or homepage search
- Use Back/Forward/Refresh buttons
- Select a profile from the dropdown before opening a site

### Quick Profiles
On the homepage, click any quick profile card to:
1. Select that profile
2. Start browsing with those settings

### Page Options
Click the floating button (bottom-right) to access:
- Simplify Page
- Reader Mode
- Hide Sidebars
- Hide Comments
- Block Ads
- Block Trackers
- Reduce Animations
- Increase Text Size
- Always use this profile for this site

### Keyboard Shortcuts
- `Cmd/Ctrl + ,` — Open Settings
- `Cmd/Ctrl + P` — Open Profile Manager
- `Cmd/Ctrl + R` — Open Site Rules

### Settings (Cmd/Ctrl + ,)
- **Appearance**: Light, Dark, or System theme
- **Startup Page**: Home or Last Session
- **Default Profile**: Choose your preferred profile
- **Ads & Tracking Protection**: Toggle on/off
- **Clear Cache**: Remove cached data

### Profile Manager (Cmd/Ctrl + P)
- Create new profiles
- Edit existing profiles
- Import/Export profiles (JSON format)
- Delete custom profiles

### Site Rules (Cmd/Ctrl + R)
Create automatic rules like:
- `youtube.com` → Android TV
- `reddit.com` → Android Phone
- `example.com` → Kindle

## Project Structure

```
silk-local/
├── main.js          # Electron main process
├── preload.js       # Preload script (secure IPC bridge)
├── package.json     # Project configuration
├── renderer/
│   ├── index.html   # Main UI
│   ├── styles.css   # Modern dark theme styles
│   └── renderer.js  # Frontend logic
└── assets/          # App icons (add your own)
```

## Technology Stack

- **Frontend**: React-style vanilla JS, CSS3
- **Desktop Shell**: Electron
- **Browser Engine**: Embedded Chromium (via webview)
- **Storage**: SQLite (better-sqlite3)
- **Filtering**: EasyList-compatible ad blocking

## Visual Style

Inspired by Safari, Arc Browser, Apple Vision Pro, Notion, and Linear:
- Large spacing
- Rounded corners
- Minimal controls
- Soft shadows
- Glass effects
- Readable typography
- Zero developer aesthetics

## License

MIT License
