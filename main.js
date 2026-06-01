const { app, BrowserWindow, ipcMain, session, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// Initialize SQLite database
const Database = require('better-sqlite3');
const dbPath = path.join(app.getPath('userData'), 'silk-local.db');
const db = new Database(dbPath);

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    userAgent TEXT NOT NULL,
    screenWidth INTEGER DEFAULT 1920,
    screenHeight INTEGER DEFAULT 1080,
    touchEnabled INTEGER DEFAULT 0,
    language TEXT DEFAULT 'en-US',
    timezone TEXT DEFAULT 'America/New_York'
  );
  
  CREATE TABLE IF NOT EXISTS site_rules (
    id TEXT PRIMARY KEY,
    domain TEXT NOT NULL,
    profileId TEXT NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

let mainWindow;
let currentWebContents = null;

// Default profiles
const defaultProfiles = [
  { id: 'desktop-chrome', name: 'Desktop Chrome', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', screenWidth: 1920, screenHeight: 1080, touchEnabled: 0 },
  { id: 'android-phone', name: 'Android Phone', userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36', screenWidth: 412, screenHeight: 915, touchEnabled: 1 },
  { id: 'android-tablet', name: 'Android Tablet', userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-T970) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', screenWidth: 800, screenHeight: 1280, touchEnabled: 1 },
  { id: 'iphone-safari', name: 'iPhone Safari', userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1', screenWidth: 393, screenHeight: 852, touchEnabled: 1 },
  { id: 'ipad-safari', name: 'iPad Safari', userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1', screenWidth: 834, screenHeight: 1194, touchEnabled: 1 },
  { id: 'android-tv', name: 'Android TV', userAgent: 'Mozilla/5.0 (Linux; Android 14; ADT-3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', screenWidth: 1920, screenHeight: 1080, touchEnabled: 0 },
  { id: 'smart-tv', name: 'Smart TV', userAgent: 'Mozilla/5.0 (SmartHub; TVx; SmartTv; U; HbbTV/1.1.1;) Gecko/20100101 Firefox/33.0', screenWidth: 1920, screenHeight: 1080, touchEnabled: 0 },
  { id: 'kindle', name: 'Kindle Reader', userAgent: 'Mozilla/5.0 (Linux; U; Android 4.0.4; en-us; Kindle Fire Build/SOJN) AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Safari/534.30', screenWidth: 600, screenHeight: 1024, touchEnabled: 1 },
  { id: 'legacy-android', name: 'Legacy Android', userAgent: 'Mozilla/5.0 (Linux; Android 4.4.4; Nexus 7 Build/KTU84P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.133 Safari/537.36', screenWidth: 600, screenHeight: 960, touchEnabled: 1 },
  { id: 'low-bandwidth', name: 'Low Bandwidth Mode', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', screenWidth: 1280, screenHeight: 720, touchEnabled: 0 },
  { id: 'samsung-tv', name: 'Samsung Smart TV', userAgent: 'Mozilla/5.0 (SMART-TV; Linux; Tizen 7.0) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/2.2 Chrome/79.0.3945.130 TV Safari/537.36', screenWidth: 1920, screenHeight: 1080, touchEnabled: 0 },
  { id: 'playstation', name: 'PlayStation Browser', userAgent: 'Mozilla/5.0 (PlayStation 5 4.00) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0 Safari/605.1.15', screenWidth: 1920, screenHeight: 1080, touchEnabled: 0 }
];

// Initialize default profiles if not exists
function initDefaultProfiles() {
  const stmt = db.prepare('SELECT COUNT(*) as count FROM profiles');
  const result = stmt.get();
  if (result.count === 0) {
    const insert = db.prepare('INSERT INTO profiles (id, name, userAgent, screenWidth, screenHeight, touchEnabled, language, timezone) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    for (const profile of defaultProfiles) {
      insert.run(profile.id, profile.name, profile.userAgent, profile.screenWidth, profile.screenHeight, profile.touchEnabled, 'en-US', 'America/New_York');
    }
  }
}

// Initialize default settings
function initDefaultSettings() {
  const settings = {
    theme: 'dark',
    startupPage: 'home',
    defaultProfile: 'desktop-chrome',
    downloadsFolder: app.getPath('downloads'),
    adBlockEnabled: true,
    performanceMode: false
  };
  const insert = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  for (const [key, value] of Object.entries(settings)) {
    insert.run(key, JSON.stringify(value));
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1200,
    minHeight: 800,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#1a1a2e',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webviewTag: true
    },
    frame: true,
    trafficLightPosition: { x: 15, y: 15 }
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  
  // Apply ad blocking filters
  applyAdBlocking();
}

function applyAdBlocking() {
  const filterRules = [
    '||ads.*^$third-party',
    '||tracker.*^$third-party',
    '||analytics.*^$third-party',
    '##.advertisement',
    '##.ad-banner',
    '##.sidebar-ad',
    '##[class*="ad-"]',
    '##[id*="ad-"]'
  ];
  
  session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
    const url = details.url.toLowerCase();
    if (url.includes('doubleclick') || url.includes('adservice') || 
        url.includes('googlesyndication') || url.includes('facebook.com/tr') ||
        url.includes('pixel') || url.includes('analytics')) {
      callback({ cancel: true });
    } else {
      callback({});
    }
  });
}

// IPC Handlers
ipcMain.handle('get-profiles', () => {
  const stmt = db.prepare('SELECT * FROM profiles ORDER BY name');
  return stmt.all();
});

ipcMain.handle('save-profile', (event, profile) => {
  const { id, name, userAgent, screenWidth, screenHeight, touchEnabled, language, timezone } = profile;
  const insert = db.prepare('INSERT OR REPLACE INTO profiles (id, name, userAgent, screenWidth, screenHeight, touchEnabled, language, timezone) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  insert.run(id || `custom-${Date.now()}`, name, userAgent, screenWidth, screenHeight, touchEnabled ? 1 : 0, language, timezone);
  return true;
});

ipcMain.handle('delete-profile', (event, id) => {
  const del = db.prepare('DELETE FROM profiles WHERE id = ?');
  del.run(id);
  return true;
});

ipcMain.handle('get-site-rules', () => {
  const stmt = db.prepare('SELECT * FROM site_rules');
  return stmt.all();
});

ipcMain.handle('save-site-rule', (event, rule) => {
  const { id, domain, profileId } = rule;
  const insert = db.prepare('INSERT OR REPLACE INTO site_rules (id, domain, profileId) VALUES (?, ?, ?)');
  insert.run(id || `rule-${Date.now()}`, domain, profileId);
  return true;
});

ipcMain.handle('delete-site-rule', (event, id) => {
  const del = db.prepare('DELETE FROM site_rules WHERE id = ?');
  del.run(id);
  return true;
});

ipcMain.handle('get-setting', (event, key) => {
  const stmt = db.prepare('SELECT value FROM settings WHERE key = ?');
  const result = stmt.get(key);
  return result ? JSON.parse(result.value) : null;
});

ipcMain.handle('set-setting', (event, key, value) => {
  const insert = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  insert.run(key, JSON.stringify(value));
  return true;
});

ipcMain.handle('navigate', (event, url) => {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  
  // Check for site rules
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace('www.', '');
    const ruleStmt = db.prepare('SELECT profileId FROM site_rules WHERE domain = ?');
    const rule = ruleStmt.get(domain);
    
    if (rule) {
      const profileStmt = db.prepare('SELECT userAgent, screenWidth, screenHeight, touchEnabled FROM profiles WHERE id = ?');
      const profile = profileStmt.get(rule.profileId);
      if (profile) {
        applyProfileToWebContents(profile);
      }
    }
  } catch (e) {
    console.log('URL parsing error:', e);
  }
  
  if (mainWindow.webContents) {
    mainWindow.webContents.loadURL(url);
    return true;
  }
  return false;
});

ipcMain.handle('go-back', () => {
  if (mainWindow.webContents && mainWindow.webContents.canGoBack()) {
    mainWindow.webContents.goBack();
    return true;
  }
  return false;
});

ipcMain.handle('go-forward', () => {
  if (mainWindow.webContents && mainWindow.webContents.canGoForward()) {
    mainWindow.webContents.goForward();
    return true;
  }
  return false;
});

ipcMain.handle('refresh', () => {
  if (mainWindow.webContents) {
    mainWindow.webContents.reload();
    return true;
  }
  return false;
});

ipcMain.handle('apply-profile', (event, profileId) => {
  const stmt = db.prepare('SELECT userAgent, screenWidth, screenHeight, touchEnabled FROM profiles WHERE id = ?');
  const profile = stmt.get(profileId);
  if (profile) {
    applyProfileToWebContents(profile);
    return true;
  }
  return false;
});

function applyProfileToWebContents(profile) {
  if (mainWindow.webContents) {
    mainWindow.webContents.setUserAgent(profile.userAgent);
    mainWindow.webContents.debugger.attach();
    mainWindow.setSize(profile.screenWidth, Math.min(profile.screenHeight, 1080));
  }
}

ipcMain.handle('simplify-page', () => {
  if (mainWindow.webContents) {
    mainWindow.webContents.executeJavaScript(`
      (function() {
        const elementsToRemove = document.querySelectorAll('nav, aside, footer, .sidebar, .comments, .advertisement, [class*="ad-"], [id*="ad-"]');
        elementsToRemove.forEach(el => el.remove());
        document.body.style.maxWidth = '800px';
        document.body.style.margin = '0 auto';
        document.body.style.padding = '20px';
      })();
    `);
    return true;
  }
  return false;
});

ipcMain.handle('reader-mode', () => {
  if (mainWindow.webContents) {
    mainWindow.webContents.executeJavaScript(`
      (function() {
        const article = document.querySelector('article, .article, .post, .content, main') || document.body;
        const title = document.querySelector('h1, .title')?.textContent || document.title;
        const content = article.innerHTML;
        
        const readerHtml = \`
          <div style="max-width: 700px; margin: 40px auto; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.8; background: #1a1a2e; color: #e0e0e0; min-height: 100vh;">
            <h1 style="font-size: 2em; margin-bottom: 20px; color: #fff;">${title}</h1>
            <div style="font-size: 1.1em;">${content}</div>
          </div>
        \`;
        document.body.innerHTML = readerHtml;
      })();
    `);
    return true;
  }
  return false;
});

ipcMain.handle('block-ads', (event, enabled) => {
  if (enabled) {
    applyAdBlocking();
  }
  return true;
});

ipcMain.handle('clear-cache', () => {
  session.defaultSession.clearCache();
  session.defaultSession.clearStorageData();
  return true;
});

ipcMain.handle('export-profile', (event, profileId) => {
  const stmt = db.prepare('SELECT * FROM profiles WHERE id = ?');
  const profile = stmt.get(profileId);
  if (profile) {
    return JSON.stringify(profile, null, 2);
  }
  return null;
});

ipcMain.handle('import-profile', (event, profileJson) => {
  try {
    const profile = JSON.parse(profileJson);
    const insert = db.prepare('INSERT OR REPLACE INTO profiles (id, name, userAgent, screenWidth, screenHeight, touchEnabled, language, timezone) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    insert.run(profile.id || `imported-${Date.now()}`, profile.name, profile.userAgent, profile.screenWidth, profile.screenHeight, profile.touchEnabled, profile.language, profile.timezone);
    return true;
  } catch (e) {
    return false;
  }
});

app.whenReady().then(() => {
  initDefaultProfiles();
  initDefaultSettings();
  createWindow();
});

app.on('window-all-closed', () => {
  db.close();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
