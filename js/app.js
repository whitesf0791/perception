import { questions } from '../data/questions.js';
import {
  STORAGE_SETUP, APP_VERSION,
  ALL_CATEGORIES, ALL_TYPES, DEFAULT_FILTERS,
  loadFilters, saveFilters, loadFavs, saveFavs,
  loadNotes, saveNotes,
} from './store.js';
import * as ui from './ui.js';

/* ── State ──────────────────────────────────── */
let filters     = loadFilters();
let favorites   = loadFavs();
let notes       = loadNotes();
let pool        = [];
let seen        = [];
let current     = null;
let currentView = 'cards';

/* ── Boot ───────────────────────────────────── */
function init() {
  ui.loadTheme();
  wireEvents();
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js');
  }
  if (localStorage.getItem(STORAGE_SETUP)) {
    enterApp();
  }
}

/* ── Pool ───────────────────────────────────── */
function buildPool() {
  pool = questions.filter(q => {
    if (!filters.categories.includes(q.category)) return false;
    if (!filters.depths.includes(q.depth))         return false;
    if (!filters.types.includes(q.type))           return false;
    if (filters.setting === 'group') return q.setting === 'both';
    return true;
  });
  seen = [];
}

function pickNext() {
  const unseen = pool.filter(q => !seen.includes(q.id));
  return unseen.length
    ? unseen[Math.floor(Math.random() * unseen.length)]
    : null;
}

/* ── Card draw ──────────────────────────────── */
function drawCard(animate = false) {
  const q = pickNext();
  current = q;
  ui.updateProgress(pool, seen);

  if (!q) {
    ui.renderEmpty(pool.length, restartPool);
    return;
  }

  ui.drawCard(q, favorites.includes(q.id), animate, { onNext: doNext, onSave: doSave });
}

function restartPool() {
  seen = [];
  drawCard(true);
}

/* ── Card actions ───────────────────────────── */
function doNext() {
  if (!current) return;
  seen.push(current.id);
  const card = ui.els.cardArea.querySelector('.card');
  card ? ui.exitCard(card, 'right', () => drawCard(true)) : drawCard(true);
}

function doSave() {
  if (!current) return;
  const id = current.id;
  if (!favorites.includes(id)) {
    favorites.push(id);
    saveFavs(favorites);
    const si  = ui.els.cardArea.querySelector('.card__saved-icon');
    const svg = si?.querySelector('svg');
    if (si)  si.classList.add('is-saved');
    if (svg) svg.setAttribute('fill', 'currentColor');
    ui.syncSaveBtn(true);
    ui.updateSavedChip(favorites.length);
  }
  seen.push(id);
  const card = ui.els.cardArea.querySelector('.card');
  card ? ui.exitCard(card, 'left', () => drawCard(true)) : drawCard(true);
}

/* ── Navigation ─────────────────────────────── */
function navigateTo(name) {
  currentView = name;
  ui.showView(name, favorites.length);
  if (name === 'favorites') ui.renderFavorites(getFavQs(), notes, removeFav, openNoteDialog);
  if (name === 'settings')  ui.updateSettingsView(favorites.length, APP_VERSION, { poolSize: pool.length, seenCount: seen.length });
}

function getFavQs() {
  return favorites.map(id => questions.find(q => q.id === id)).filter(Boolean);
}

function removeFav(id) {
  favorites = favorites.filter(f => f !== id);
  saveFavs(favorites);
  ui.renderFavorites(getFavQs(), notes, removeFav, openNoteDialog);
  ui.updateSavedChip(favorites.length);
}

function openNoteDialog(id) {
  const q = questions.find(q => q.id === id);
  ui.openNoteDialog(id, notes[id] || '', q?.question || '', (text) => {
    if (text.trim()) {
      notes[id] = text.trim();
    } else {
      delete notes[id];
    }
    saveNotes(notes);
    ui.renderFavorites(getFavQs(), notes, removeFav, openNoteDialog);
  });
}

/* ── Setup flow ─────────────────────────────── */
function completeSetup() {
  const settingBtn = document.querySelector('#setup-setting .setting-card.active');
  if (settingBtn) filters.setting = settingBtn.dataset.val;

  const depthBtn = document.querySelector('#setup-depth .depth-card.active');
  if (depthBtn) filters.depths = depthBtn.dataset.depths.split(',').map(Number);

  saveFilters(filters);
  localStorage.setItem(STORAGE_SETUP, '1');
  enterApp();
}

function enterApp() {
  ui.els.navBar.style.display     = '';
  ui.els.btnNewSess.style.display = '';
  ui.applyFiltersToChips(filters);
  buildPool();
  ui.updateFilterBadge(filters);
  ui.updateSavedChip(favorites.length);
  ui.els.setupView.classList.remove('active');
  navigateTo('cards');
  drawCard(true);
}

/* ── Export saved ───────────────────────────── */
function exportSaved() {
  const favQs = getFavQs();
  if (!favQs.length) return;

  const depthLabel = { 1: 'Light', 2: 'Moderate', 3: 'Deep' };
  const categoryLabel = s => s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const lines = favQs.map((q, i) => {
    const note = notes[q.id] ? `\n   Note: ${notes[q.id]}` : '';
    return `${i + 1}. ${q.question}\n   [${depthLabel[q.depth]} · ${categoryLabel(q.category)} · ${q.type}]${note}`;
  });
  const text = `Saved Questions — Perception\nExported ${new Date().toLocaleDateString()}\n\n${lines.join('\n\n')}`;

  const blob = new Blob([text], { type: 'text/plain' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `perception-saved-${new Date().toISOString().slice(0,10)}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ── Surprise me ────────────────────────────── */
function surpriseMe() {
  const depthOptions = [
    [1,2,3],[1,2,3],[1,2,3],
    [1,2],
    [2,3],
    [2],
  ];
  const depths = depthOptions[Math.floor(Math.random() * depthOptions.length)];
  const shuffled = [...ALL_CATEGORIES].sort(() => Math.random() - 0.5);
  const categories = shuffled.slice(0, 3 + Math.round(Math.random()));
  filters = { categories, depths, setting: filters.setting, types: [...ALL_TYPES] };
  saveFilters(filters);
  buildPool();
  ui.updateFilterBadge(filters);
  ui.applyFiltersToChips(filters);
  ui.closeSheet();
  if (currentView === 'cards') drawCard(true);
}

/* ── Session reset ──────────────────────────── */
function openResetDialog() {
  ui.openDialog({
    title: 'Start a new session?',
    body: "You'll choose fresh settings for a new group. Your saved questions will stay.",
    confirmText: 'New session',
    cb: confirmReset,
  });
}

function confirmReset() {
  localStorage.removeItem(STORAGE_SETUP);
  seen = [];
  current = null;
  document.querySelectorAll('.setting-card').forEach((b, i) => {
    b.classList.toggle('active', i === 0);
    b.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
  });
  document.querySelectorAll('.depth-card').forEach(b => {
    const isMix = b.classList.contains('mix-card');
    b.classList.toggle('active', isMix);
    b.setAttribute('aria-pressed', isMix ? 'true' : 'false');
  });
  ui.els.navBar.style.display     = 'none';
  ui.els.btnFilter.style.display  = 'none';
  ui.els.btnNewSess.style.display = 'none';
  ui.els.cardView.classList.remove('active');
  ui.els.favoritesView.classList.remove('active');
  ui.els.settingsView.classList.remove('active');
  ui.els.setupView.classList.add('active');
  currentView = 'setup';
}

/* ── Update check ───────────────────────────── */
async function checkForUpdate() {
  ui.els.btnCheckUpd.disabled       = true;
  ui.els.updateStatus.className     = 'update-status';
  ui.els.updateStatus.textContent   = 'Checking…';
  ui.els.btnDoUpd.style.display     = 'none';

  // Prompt the browser to fetch a fresh SW, which will activate on next reload
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistration('./sw.js')
      .then(reg => reg?.update())
      .catch(() => {});
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch('./version.json', { cache: 'no-store', signal: controller.signal });
    if (!res.ok) throw new Error('Network error');
    const data   = await res.json();
    const remote = data.version;

    if (remote && remote !== APP_VERSION) {
      ui.els.updateStatus.textContent = `Update available: v${remote}`;
      ui.els.updateStatus.className   = 'update-status update-status--available';
      ui.els.btnDoUpd.style.display   = '';
    } else {
      ui.els.updateStatus.textContent = `You’re up to date (v${APP_VERSION})`;
      ui.els.updateStatus.className   = 'update-status update-status--ok';
    }
  } catch(e) {
    ui.els.updateStatus.textContent = e.name === 'AbortError'
      ? 'Check timed out. Try again when online.'
      : 'Couldn’t check for updates. Try again when online.';
    ui.els.updateStatus.className = 'update-status update-status--error';
  } finally {
    clearTimeout(timer);
    ui.els.btnCheckUpd.disabled = false;
  }
}

async function performUpdate() {
  ui.els.btnDoUpd.disabled          = true;
  ui.els.updateStatus.textContent   = 'Clearing cache…';

  try {
    const keys = await caches.keys();
    await Promise.all(
      keys.filter(k => k.startsWith('conv-cards-')).map(k => caches.delete(k))
    );
  } catch(e) { /* Cache API may be unavailable */ }

  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.getRegistration('./sw.js');
      if (reg) await reg.unregister();
    } catch(e) { /* ignore */ }
  }

  location.reload(true);
}

/* ── Event wiring ───────────────────────────── */
function wireEvents() {
  ui.els.btnNewSess.addEventListener('click', openResetDialog);

  ui.els.dialogConf.addEventListener('click', ui.confirmDialogAction);
  ui.els.dialogCancel.addEventListener('click', ui.closeDialog);
  ui.els.dialogScrim.addEventListener('click', ui.closeDialog);

  document.getElementById('note-cancel').addEventListener('click', ui.closeNoteDialog);
  document.getElementById('note-save').addEventListener('click', ui.confirmNoteDialog);
  document.getElementById('note-scrim').addEventListener('click', ui.closeNoteDialog);
  document.getElementById('note-textarea').addEventListener('input', e => {
    document.getElementById('note-char-count').textContent = `${e.target.value.length} / 500`;
  });

  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (document.getElementById('note-dialog').classList.contains('open')) ui.closeNoteDialog();
    if (ui.els.resetDialog.classList.contains('open')) ui.closeDialog();
    if (ui.els.filterSheet.classList.contains('open')) ui.closeSheet();
  });

  ui.els.savedChip.addEventListener('click', () => navigateTo('favorites'));

  document.getElementById('btn-start').addEventListener('click', completeSetup);

  document.getElementById('setup-setting').addEventListener('click', e => {
    const btn = e.target.closest('.setting-card');
    if (!btn) return;
    document.querySelectorAll('.setting-card').forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-pressed', 'false');
    });
    btn.classList.add('active');
    btn.setAttribute('aria-pressed', 'true');
  });

  document.getElementById('setup-depth').addEventListener('click', e => {
    const btn = e.target.closest('.depth-card');
    if (!btn) return;
    document.querySelectorAll('.depth-card').forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-pressed', 'false');
    });
    btn.classList.add('active');
    btn.setAttribute('aria-pressed', 'true');
  });

  ui.els.navCards.addEventListener('click',    () => navigateTo('cards'));
  ui.els.navSaved.addEventListener('click',    () => navigateTo('favorites'));
  ui.els.navSettings.addEventListener('click', () => navigateTo('settings'));

  ui.els.btnNext.addEventListener('click', doNext);
  ui.els.btnSave.addEventListener('click', doSave);

  ui.els.btnFilter.addEventListener('click', ui.openSheet);
  ui.els.scrim.addEventListener('click', ui.closeSheet);

  document.getElementById('chips-depth').addEventListener('click', e => {
    const c = e.target.closest('.chip'); if (c) c.classList.toggle('active');
  });
  document.getElementById('chips-category').addEventListener('click', e => {
    const c = e.target.closest('.chip'); if (c) c.classList.toggle('active');
  });
  ui.els.chipsType.addEventListener('click', e => {
    const c = e.target.closest('.chip'); if (c) c.classList.toggle('active');
  });
  document.getElementById('chips-setting').addEventListener('click', e => {
    const btn = e.target.closest('.seg-btn');
    if (!btn) return;
    document.querySelectorAll('#chips-setting .seg-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });

  ui.els.typeLabel.addEventListener('click', ui.toggleTypeSection);
  ui.els.typeLabel.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ui.toggleTypeSection(); }
  });

  ui.els.btnSurprise.addEventListener('click', surpriseMe);

  ui.els.btnApply.addEventListener('click', () => {
    const depths     = [...document.querySelectorAll('#chips-depth    .chip.active')].map(c => Number(c.dataset.val));
    const categories = [...document.querySelectorAll('#chips-category .chip.active')].map(c => c.dataset.val);
    const types      = [...document.querySelectorAll('#chips-type     .chip.active')].map(c => c.dataset.val);
    const setting    = document.querySelector('#chips-setting .seg-btn.active')?.dataset.val || 'any';

    filters = {
      depths:     depths.length     ? depths     : [1, 2, 3],
      categories: categories.length ? categories : [...ALL_CATEGORIES],
      types:      types.length      ? types      : [...ALL_TYPES],
      setting,
    };
    saveFilters(filters);
    buildPool();
    ui.updateFilterBadge(filters);
    ui.closeSheet();
    if (currentView === 'cards') drawCard(true);
  });

  ui.els.btnReset.addEventListener('click', () => {
    filters = { ...DEFAULT_FILTERS, categories: [...ALL_CATEGORIES], types: [...ALL_TYPES] };
    ui.applyFiltersToChips(filters);
  });

  ui.els.themeSeg.addEventListener('click', e => {
    const btn = e.target.closest('.seg-btn');
    if (!btn) return;
    ui.setTheme(btn.dataset.theme);
  });

  ui.els.btnExportSaved.addEventListener('click', exportSaved);

  ui.els.btnClearSaved.addEventListener('click', () => {
    if (!favorites.length) return;
    ui.openDialog({
      title: 'Clear saved questions?',
      body: `This will permanently remove all ${favorites.length} saved question${favorites.length !== 1 ? 's' : ''}. This cannot be undone.`,
      confirmText: 'Clear all',
      cb: () => {
        favorites = [];
        saveFavs(favorites);
        ui.updateSavedChip(0);
        if (currentView === 'settings') ui.updateSettingsView(0, APP_VERSION, { poolSize: pool.length, seenCount: seen.length });
      },
    });
  });

  ui.els.btnClearHist.addEventListener('click', () => {
    ui.openDialog({
      title: 'Clear session history?',
      body: "All cards will be marked as unseen and you'll start fresh from the full deck.",
      confirmText: 'Clear history',
      cb: () => {
        seen = [];
        if (currentView === 'cards') drawCard(true);
        if (currentView === 'settings') ui.updateSettingsView(favorites.length, APP_VERSION, { poolSize: pool.length, seenCount: 0 });
      },
    });
  });

  ui.els.btnCheckUpd.addEventListener('click', checkForUpdate);
  ui.els.btnDoUpd.addEventListener('click', performUpdate);
}

init();
