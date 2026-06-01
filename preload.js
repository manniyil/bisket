const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('silkAPI', {
  // Profiles
  getProfiles: () => ipcRenderer.invoke('get-profiles'),
  saveProfile: (profile) => ipcRenderer.invoke('save-profile', profile),
  deleteProfile: (id) => ipcRenderer.invoke('delete-profile', id),
  exportProfile: (id) => ipcRenderer.invoke('export-profile', id),
  importProfile: (json) => ipcRenderer.invoke('import-profile', json),
  
  // Site Rules
  getSiteRules: () => ipcRenderer.invoke('get-site-rules'),
  saveSiteRule: (rule) => ipcRenderer.invoke('save-site-rule', rule),
  deleteSiteRule: (id) => ipcRenderer.invoke('delete-site-rule', id),
  
  // Settings
  getSetting: (key) => ipcRenderer.invoke('get-setting', key),
  setSetting: (key, value) => ipcRenderer.invoke('set-setting', key, value),
  
  // Navigation
  navigate: (url) => ipcRenderer.invoke('navigate', url),
  goBack: () => ipcRenderer.invoke('go-back'),
  goForward: () => ipcRenderer.invoke('go-forward'),
  refresh: () => ipcRenderer.invoke('refresh'),
  applyProfile: (profileId) => ipcRenderer.invoke('apply-profile', profileId),
  
  // Page Actions
  simplifyPage: () => ipcRenderer.invoke('simplify-page'),
  readerMode: () => ipcRenderer.invoke('reader-mode'),
  blockAds: (enabled) => ipcRenderer.invoke('block-ads', enabled),
  clearCache: () => ipcRenderer.invoke('clear-cache')
});
