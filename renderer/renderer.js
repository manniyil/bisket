// Silk Local - Renderer Process

let profiles = [];
let currentProfile = null;
let selectedProfileId = null;

// DOM Elements
const urlInput = document.getElementById('urlInput');
const homeSearchInput = document.getElementById('homeSearchInput');
const profileSelect = document.getElementById('profileSelect');
const openBtn = document.getElementById('openBtn');
const backBtn = document.getElementById('backBtn');
const forwardBtn = document.getElementById('forwardBtn');
const refreshBtn = document.getElementById('refreshBtn');
const homepage = document.getElementById('homepage');
const browserView = document.getElementById('browserView');
const quickProfiles = document.getElementById('quickProfiles');
const pageOptionsBtn = document.getElementById('pageOptionsBtn');
const pageOptionsPanel = document.getElementById('pageOptionsPanel');

// Modals
const settingsModal = document.getElementById('settingsModal');
const profileModal = document.getElementById('profileModal');
const rulesModal = document.getElementById('rulesModal');
const editProfileModal = document.getElementById('editProfileModal');

// Quick profiles to show on homepage
const QUICK_PROFILE_IDS = ['desktop-chrome', 'android-phone', 'android-tv', 'kindle', 'low-bandwidth'];

// Initialize
async function init() {
  await loadProfiles();
  setupEventListeners();
  renderQuickProfiles();
}

// Load profiles from database
async function loadProfiles() {
  profiles = await window.silkAPI.getProfiles();
  populateProfileSelect();
}

// Populate profile dropdown
function populateProfileSelect() {
  profileSelect.innerHTML = '<option value="">Select Profile...</option>';
  profiles.forEach(profile => {
    const option = document.createElement('option');
    option.value = profile.id;
    option.textContent = profile.name;
    profileSelect.appendChild(option);
  });
}

// Render quick profile cards on homepage
function renderQuickProfiles() {
  quickProfiles.innerHTML = '';
  const quickProfilesList = profiles.filter(p => QUICK_PROFILE_IDS.includes(p.id));
  
  quickProfilesList.forEach(profile => {
    const card = document.createElement('div');
    card.className = 'profile-card';
    card.innerHTML = `<div class="profile-card-name">${profile.name}</div>`;
    card.addEventListener('click', () => selectQuickProfile(profile));
    quickProfiles.appendChild(card);
  });
}

// Select a quick profile
async function selectQuickProfile(profile) {
  currentProfile = profile;
  profileSelect.value = profile.id;
  await window.silkAPI.applyProfile(profile.id);
}

// Setup event listeners
function setupEventListeners() {
  // Navigation buttons
  backBtn.addEventListener('click', () => window.silkAPI.goBack());
  forwardBtn.addEventListener('click', () => window.silkAPI.goForward());
  refreshBtn.addEventListener('click', () => window.silkAPI.refresh());
  
  // Open button
  openBtn.addEventListener('click', handleOpen);
  
  // URL input
  urlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleOpen();
  });
  
  // Home search input
  homeSearchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleHomeSearch();
  });
  
  // Profile select
  profileSelect.addEventListener('change', async (e) => {
    if (e.target.value) {
      await window.silkAPI.applyProfile(e.target.value);
      currentProfile = profiles.find(p => p.id === e.target.value);
    }
  });
  
  // Page options
  pageOptionsBtn.addEventListener('click', togglePageOptions);
  
  // Option items
  document.querySelectorAll('.option-item').forEach(item => {
    item.addEventListener('click', handleOptionAction);
  });
  
  // Close modals
  document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.target.closest('.modal').classList.add('hidden');
    });
  });
  
  // Click outside to close modals
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.add('hidden');
    });
  });
  
  // Settings button (add to toolbar via menu or keyboard shortcut)
  document.addEventListener('keydown', (e) => {
    if (e.key === ',' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      openSettings();
    }
    if (e.key === 'p' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      openProfileManager();
    }
    if (e.key === 'r' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      openRulesManager();
    }
  });
  
  // Profile form
  document.getElementById('profileForm').addEventListener('submit', handleProfileSubmit);
  
  // Profile actions
  document.getElementById('newProfileBtn').addEventListener('click', () => openEditProfile());
  document.getElementById('importProfileBtn').addEventListener('click', handleImportProfile);
  document.getElementById('exportProfileBtn').addEventListener('click', handleExportProfile);
  document.getElementById('deleteProfileBtn').addEventListener('click', handleDeleteProfile);
  
  // Rules
  document.getElementById('addRuleBtn').addEventListener('click', handleAddRule);
  
  // Settings actions
  document.getElementById('clearCacheBtn').addEventListener('click', handleClearCache);
  document.getElementById('adBlockToggle').addEventListener('change', handleAdBlockToggle);
}

// Handle open button click
async function handleOpen() {
  const url = urlInput.value.trim() || homeSearchInput.value.trim();
  if (!url) return;
  
  await navigateToUrl(url);
}

// Handle home search
async function handleHomeSearch() {
  const url = homeSearchInput.value.trim();
  if (!url) return;
  
  await navigateToUrl(url);
}

// Navigate to URL
async function navigateToUrl(url) {
  // Add protocol if missing
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  
  // Hide homepage, show browser view
  homepage.classList.add('hidden');
  browserView.classList.remove('hidden');
  browserView.classList.add('active');
  pageOptionsBtn.classList.remove('hidden');
  
  // Load URL in webview
  browserView.src = url;
  urlInput.value = url;
}

// Toggle page options panel
function togglePageOptions() {
  pageOptionsPanel.classList.toggle('hidden');
}

// Handle option actions
async function handleOptionAction(e) {
  const action = e.target.dataset.action;
  
  switch (action) {
    case 'simplify':
      await window.silkAPI.simplifyPage();
      break;
    case 'reader':
      await window.silkAPI.readerMode();
      break;
    case 'hide-sidebars':
      await hideSidebars();
      break;
    case 'hide-comments':
      await hideComments();
      break;
    case 'block-ads':
      await window.silkAPI.blockAds(true);
      break;
    case 'block-trackers':
      await blockTrackers();
      break;
    case 'reduce-animations':
      await reduceAnimations();
      break;
    case 'increase-text':
      await increaseTextSize();
      break;
    case 'always-use':
      await createSiteRule();
      break;
  }
  
  pageOptionsPanel.classList.add('hidden');
}

// Additional page actions
async function hideSidebars() {
  browserView.executeJavaScript(`
    (function() {
      document.querySelectorAll('aside, .sidebar, [class*="sidebar"], [id*="sidebar"]').forEach(el => el.style.display = 'none');
    })();
  `);
}

async function hideComments() {
  browserView.executeJavaScript(`
    (function() {
      document.querySelectorAll('.comments, .comment-section, [id*="comment"], [class*="comment"]').forEach(el => el.style.display = 'none');
    })();
  `);
}

async function blockTrackers() {
  await window.silkAPI.blockAds(true);
}

async function reduceAnimations() {
  browserView.executeJavaScript(`
    (function() {
      document.documentElement.style.setProperty('--animation-duration', '0.01ms');
      document.querySelectorAll('*').forEach(el => {
        el.style.animation = 'none';
        el.style.transition = 'none';
      });
    })();
  `);
}

async function increaseTextSize() {
  browserView.executeJavaScript(`
    (function() {
      const currentSize = parseFloat(getComputedStyle(document.body).fontSize);
      document.body.style.fontSize = (currentSize * 1.2) + 'px';
    })();
  `);
}

async function createSiteRule() {
  try {
    const url = new URL(browserView.src);
    const domain = url.hostname.replace('www.', '');
    
    if (currentProfile) {
      await window.silkAPI.saveSiteRule({
        domain,
        profileId: currentProfile.id
      });
      alert(`Rule created: ${domain} will always use ${currentProfile.name}`);
    }
  } catch (e) {
    console.error('Error creating rule:', e);
  }
}

// Open settings
async function openSettings() {
  settingsModal.classList.remove('hidden');
  
  // Load current settings
  const theme = await window.silkAPI.getSetting('theme');
  const startupPage = await window.silkAPI.getSetting('startupPage');
  const defaultProfile = await window.silkAPI.getSetting('defaultProfile');
  const adBlockEnabled = await window.silkAPI.getSetting('adBlockEnabled');
  
  if (theme) document.getElementById('themeSelect').value = theme;
  if (startupPage) document.getElementById('startupPageSelect').value = startupPage;
  if (defaultProfile) document.getElementById('defaultProfileSelect').value = defaultProfile;
  document.getElementById('adBlockToggle').checked = adBlockEnabled !== false;
  
  // Populate default profile select
  const defaultProfileSelect = document.getElementById('defaultProfileSelect');
  defaultProfileSelect.innerHTML = '';
  profiles.forEach(profile => {
    const option = document.createElement('option');
    option.value = profile.id;
    option.textContent = profile.name;
    defaultProfileSelect.appendChild(option);
  });
}

// Open profile manager
async function openProfileManager() {
  profileModal.classList.remove('hidden');
  await renderProfilesList();
}

// Render profiles list
async function renderProfilesList() {
  const list = document.getElementById('profilesList');
  list.innerHTML = '';
  
  profiles.forEach(profile => {
    const item = document.createElement('div');
    item.className = 'profile-item';
    if (selectedProfileId === profile.id) item.classList.add('selected');
    
    item.innerHTML = `
      <span class="profile-item-name">${profile.name}</span>
      <button class="edit-profile-btn" data-id="${profile.id}">Edit</button>
    `;
    
    item.addEventListener('click', (e) => {
      if (!e.target.classList.contains('edit-profile-btn')) {
        selectedProfileId = profile.id;
        renderProfilesList();
      }
    });
    
    item.querySelector('.edit-profile-btn').addEventListener('click', () => {
      openEditProfile(profile);
    });
    
    list.appendChild(item);
  });
}

// Open edit profile modal
function openEditProfile(profile = null) {
  editProfileModal.classList.remove('hidden');
  
  if (profile) {
    document.getElementById('editProfileTitle').textContent = 'Edit Profile';
    document.getElementById('profileId').value = profile.id;
    document.getElementById('profileName').value = profile.name;
    document.getElementById('profileUserAgent').value = profile.userAgent;
    document.getElementById('profileWidth').value = profile.screenWidth;
    document.getElementById('profileHeight').value = profile.screenHeight;
    document.getElementById('profileLanguage').value = profile.language || 'en-US';
    document.getElementById('profileTimezone').value = profile.timezone || 'America/New_York';
    document.getElementById('profileTouch').checked = profile.touchEnabled === 1;
  } else {
    document.getElementById('editProfileTitle').textContent = 'Create Profile';
    document.getElementById('profileForm').reset();
    document.getElementById('profileId').value = '';
  }
}

// Handle profile form submit
async function handleProfileSubmit(e) {
  e.preventDefault();
  
  const profile = {
    id: document.getElementById('profileId').value || null,
    name: document.getElementById('profileName').value,
    userAgent: document.getElementById('profileUserAgent').value,
    screenWidth: parseInt(document.getElementById('profileWidth').value),
    screenHeight: parseInt(document.getElementById('profileHeight').value),
    language: document.getElementById('profileLanguage').value,
    timezone: document.getElementById('profileTimezone').value,
    touchEnabled: document.getElementById('profileTouch').checked
  };
  
  await window.silkAPI.saveProfile(profile);
  editProfileModal.classList.add('hidden');
  await loadProfiles();
  renderQuickProfiles();
}

// Handle delete profile
async function handleDeleteProfile() {
  const id = document.getElementById('profileId').value;
  if (id && confirm('Are you sure you want to delete this profile?')) {
    await window.silkAPI.deleteProfile(id);
    editProfileModal.classList.add('hidden');
    await loadProfiles();
    renderQuickProfiles();
  }
}

// Handle import profile
async function handleImportProfile() {
  const json = prompt('Paste profile JSON:');
  if (json) {
    const success = await window.silkAPI.importProfile(json);
    if (success) {
      await loadProfiles();
      renderQuickProfiles();
      alert('Profile imported successfully!');
    } else {
      alert('Failed to import profile. Please check the JSON format.');
    }
  }
}

// Handle export profile
async function handleExportProfile() {
  if (selectedProfileId) {
    const json = await window.silkAPI.exportProfile(selectedProfileId);
    if (json) {
      navigator.clipboard.writeText(json);
      alert('Profile JSON copied to clipboard!');
    }
  } else {
    alert('Please select a profile first.');
  }
}

// Open rules manager
async function openRulesManager() {
  rulesModal.classList.remove('hidden');
  await renderRulesList();
  
  // Populate rule profile select
  const ruleProfile = document.getElementById('ruleProfile');
  ruleProfile.innerHTML = '';
  profiles.forEach(profile => {
    const option = document.createElement('option');
    option.value = profile.id;
    option.textContent = profile.name;
    ruleProfile.appendChild(option);
  });
}

// Render rules list
async function renderRulesList() {
  const rules = await window.silkAPI.getSiteRules();
  const list = document.getElementById('rulesList');
  list.innerHTML = '';
  
  rules.forEach(rule => {
    const profile = profiles.find(p => p.id === rule.profileId);
    const item = document.createElement('div');
    item.className = 'rule-item';
    item.innerHTML = `
      <div>
        <div class="rule-item-domain">${rule.domain}</div>
        <div class="rule-item-profile">Uses: ${profile ? profile.name : 'Unknown'}</div>
      </div>
      <button data-id="${rule.id}">&times;</button>
    `;
    
    item.querySelector('button').addEventListener('click', async () => {
      await window.silkAPI.deleteSiteRule(rule.id);
      await renderRulesList();
    });
    
    list.appendChild(item);
  });
}

// Handle add rule
async function handleAddRule() {
  const domain = document.getElementById('ruleDomain').value.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  const profileId = document.getElementById('ruleProfile').value;
  
  if (domain && profileId) {
    await window.silkAPI.saveSiteRule({ domain, profileId });
    document.getElementById('ruleDomain').value = '';
    await renderRulesList();
  }
}

// Handle clear cache
async function handleClearCache() {
  await window.silkAPI.clearCache();
  alert('Cache cleared!');
}

// Handle ad block toggle
async function handleAdBlockToggle(e) {
  await window.silkAPI.setSetting('adBlockEnabled', e.target.checked);
  await window.silkAPI.blockAds(e.target.checked);
}

// Initialize app
init();
