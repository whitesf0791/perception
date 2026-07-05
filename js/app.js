import { questions } from '../data/questions.js';
import { DECKS }     from '../data/decks.js';
import {
  STORAGE_SETUP, APP_VERSION, DEPTH_LABELS, CUSTOM_ID_BASE,
  ALL_CATEGORIES, ALL_TYPES, DEFAULT_FILTERS, FILTER_PRESETS,
  loadFilters, saveFilters, loadFavs, saveFavs,
  loadNotes, saveNotes, loadSeen, saveSeen,
  loadRatings, saveRatings,
  loadPlayers, savePlayers, loadDeckProgress, saveDeckProgress,
  loadCustom, saveCustom, loadTimer, saveTimer,
} from './store.js';
import * as ui from './ui.js';

/* ── State ──────────────────────────────────── */
let filters      = loadFilters();
let favorites    = loadFavs();
let notes        = loadNotes();
let seen         = loadSeen();          // free-play history
let ratings      = loadRatings();
let players      = loadPlayers();       // { names: [], turn: 0 }
let deckProgress = loadDeckProgress();  // { deckId: [seen ids] }
let customQs     = loadCustom();        // [{ id, question, depth }]
let timerSecs    = loadTimer();
let pool         = [];
let current      = null;
let currentView  = 'cards';
let activeDeck   = null;
let favTab       = 'saved';
let installPrompt = null;

let allQuestions = [];
let questionById = new Map();

function rebuildQuestionIndex() {
  allQuestions = [
    ...questions,
    ...customQs.map(c => ({ ...c, category: 'custom', type: 'reveal', setting: 'both', custom: true })),
  ];
  questionById = new Map(allQuestions.map(q => [q.id, q]));
}
rebuildQuestionIndex();

/* Seen history is per-mode: deck progress persists per deck id */
function getSeen() {
  return activeDeck ? (deckProgress[activeDeck.id] || []) : seen;
}

function setSeenList(list) {
  if (activeDeck) {
    deckProgress[activeDeck.id] = list;
    saveDeckProgress(deckProgress);
  } else {
    seen = list;
    saveSeen(seen);
  }
}

/* ── Boot ───────────────────────────────────── */
function init() {
  ui.loadTheme();
  wireEvents();
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js');
  }

  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    installPrompt = e;
    ui.syncInstallItem(true);
  });
  window.addEventListener('appinstalled', () => {
    installPrompt = null;
    ui.syncInstallItem(false);
    ui.showToast('App installed');
  });

  const hash = location.hash;
  if (hash.startsWith('#deck=')) {
    const d = DECKS.find(d => d.id === hash.slice(6));
    if (d) activeDeck = d;
  }

  ui.renderPlayerChips(players.names, removePlayer);

  if (localStorage.getItem(STORAGE_SETUP)) {
    enterApp();
  }
}

/* ── Pool ───────────────────────────────────── */
function buildPool() {
  pool = allQuestions.filter(q => {
    if (!filters.depths.includes(q.depth)) return false;
    if (q.custom) return true;  // custom questions ignore category/type/setting filters
    if (!filters.categories.includes(q.category)) return false;
    if (!filters.types.includes(q.type))           return false;
    if (filters.setting === 'group') return q.setting === 'both';
    return true;
  });
}

function pickNext() {
  const seenSet = new Set(getSeen());
  if (activeDeck) {
    return activeDeck.ids
      .map(id => questionById.get(id))
      .filter(Boolean)
      .find(q => !seenSet.has(q.id)) || null;
  }
  const unseen = pool.filter(q => !seenSet.has(q.id));
  if (!unseen.length) return null;

  // Variety guard: avoid repeating the previous card's category when possible
  const lastId  = getSeen().at(-1);
  const lastCat = current?.category ?? questionById.get(lastId)?.category ?? null;
  let candidates = unseen;
  if (lastCat) {
    const varied = unseen.filter(q => q.category !== lastCat);
    if (varied.length) candidates = varied;
  }

  // Weighted sampling: liked = 3×, disliked = 0.3×, neutral = 1×
  const weights = candidates.map(q => {
    const r = ratings[q.id];
    return r === 1 ? 3 : r === -1 ? 0.3 : 1;
  });
  const total = weights.reduce((s, w) => s + w, 0);
  let rand = Math.random() * total;
  for (let i = 0; i < candidates.length; i++) {
    rand -= weights[i];
    if (rand <= 0) return candidates[i];
  }
  return candidates[candidates.length - 1];
}

/* ── Card draw ──────────────────────────────── */
function cardHandlers(q) {
  return {
    onNext:  doNext,
    onSave:  doSave,
    onUndo:  getSeen().length > 0 ? doUndo : null,
    onRate:  doRate,
    onShare: () => shareQuestion(current),
    rating:  ratings[q.id] ?? 0,
  };
}

function drawCard(animate = false) {
  const q = pickNext();
  current = q;
  ui.updateProgress(pool, getSeen(), activeDeck);
  ui.syncUndoBtn(getSeen().length > 0);

  if (!q) {
    if (activeDeck) {
      ui.renderDeckComplete(activeDeck.label, restartPool, exitDeck);
    } else {
      ui.renderEmpty(pool.length, restartPool);
    }
    return;
  }

  ui.drawCard(q, favorites.includes(q.id), animate, cardHandlers(q));
  ui.startCardTimer(timerSecs);
}

/* Animate the current card off screen, unless a swipe gesture already did. */
function animateOut(direction, after) {
  const card = ui.els.cardArea.querySelector('.card');
  if (!card || card.classList.contains('exit-left') || card.classList.contains('exit-right')) {
    after();
  } else {
    ui.exitCard(card, direction, after);
  }
}

function restartPool() {
  setSeenList([]);
  drawCard(true);
}

/* ── Turn taking ────────────────────────────── */
function advanceTurn(dir = 1) {
  const n = players.names.length;
  if (n < 2) return;
  players.turn = ((players.turn + dir) % n + n) % n;
  savePlayers(players);
  ui.syncTurnBanner(players);
}

function addPlayer() {
  const name = ui.els.playerInput.value.trim();
  if (!name) return;
  if (players.names.length >= 12) { ui.showToast('That’s plenty of players'); return; }
  players.names.push(name);
  players.turn = 0;
  savePlayers(players);
  ui.els.playerInput.value = '';
  ui.renderPlayerChips(players.names, removePlayer);
  ui.els.playerInput.focus();
}

function removePlayer(index) {
  players.names.splice(index, 1);
  players.turn = 0;
  savePlayers(players);
  ui.renderPlayerChips(players.names, removePlayer);
}

/* ── Deck mode ──────────────────────────────── */
function startDeck(id) {
  const d = DECKS.find(d => d.id === id);
  if (!d) return;
  activeDeck = d;
  history.replaceState(null, '', '#deck=' + id);
  ui.syncDeckMode(activeDeck);
  ui.closeSheet();
  ui.closeDeckSheet();
  const resumed = (deckProgress[d.id] || []).length;
  if (resumed > 0 && resumed < d.ids.length) {
    ui.showToast(`Resuming ${d.label} — card ${resumed + 1} of ${d.ids.length}`);
  }
  if (currentView === 'cards') drawCard(true);
  else navigateTo('cards');
}

function exitDeck() {
  activeDeck = null;
  history.replaceState(null, '', location.pathname);
  ui.syncDeckMode(null);
  buildPool();
  if (currentView === 'cards') drawCard(true);
}

/* Leave deck mode without touching progress — used when filters take over. */
function clearDeckMode() {
  if (!activeDeck) return;
  activeDeck = null;
  ui.syncDeckMode(null);
  history.replaceState(null, '', location.pathname);
}

/* ── Card actions ───────────────────────────── */
function doUndo() {
  const seenList = getSeen();
  if (!seenList.length) return;
  const prevQ = questionById.get(seenList[seenList.length - 1]);
  if (!prevQ) return;
  setSeenList(seenList.slice(0, -1));
  advanceTurn(-1);
  ui.updateProgress(pool, getSeen(), activeDeck);
  ui.syncUndoBtn(getSeen().length > 0);
  animateOut('left', () => {
    current = prevQ;
    ui.drawCard(prevQ, favorites.includes(prevQ.id), true, cardHandlers(prevQ));
    ui.startCardTimer(timerSecs);
  });
}

function doNext() {
  if (!current) return;
  setSeenList([...getSeen(), current.id]);
  advanceTurn(1);
  animateOut('right', () => drawCard(true));
}

function doSave() {
  if (!current) return;
  const id = current.id;
  if (!favorites.includes(id)) {
    favorites.push(id);
    saveFavs(favorites);
    ui.syncSavedIcon(true);
    ui.syncSaveBtn(true);
    ui.updateSavedChip(favorites.length);
  }
  setSeenList([...getSeen(), id]);
  advanceTurn(1);
  animateOut('right', () => drawCard(true));
}

function doRate(value) {
  if (!current) return;
  const id = current.id;
  if (ratings[id] === value) {
    delete ratings[id];
  } else {
    ratings[id] = value;
  }
  saveRatings(ratings);
  ui.syncRatingBtns(ratings[id] ?? 0);
}

/* ── Share ──────────────────────────────────── */
async function shareQuestion(q) {
  if (!q) return;
  const text = `"${q.question}"\n\n— Perception, conversation cards`;
  if (navigator.share) {
    try { await navigator.share({ text }); } catch (e) { /* user cancelled */ }
  } else if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      ui.showToast('Copied to clipboard');
    } catch (e) {
      ui.showToast('Couldn’t copy — try again');
    }
  } else {
    ui.showToast('Sharing isn’t supported here');
  }
}

const shareById = id => shareQuestion(questionById.get(id));

/* ── Navigation ─────────────────────────────── */
function navigateTo(name) {
  currentView = name;
  ui.showView(name, favorites.length);
  if (name === 'cards' && current) {
    // Saved state may have changed from the History tab
    const isSaved = favorites.includes(current.id);
    ui.syncSaveBtn(isSaved);
    ui.syncSavedIcon(isSaved);
  }
  if (name === 'favorites') renderFavoritesView();
  if (name === 'settings')  refreshSettings();
}

function refreshSettings() {
  ui.updateSettingsView(favorites.length, APP_VERSION, {
    poolSize:    pool.length,
    seenCount:   getSeen().length,
    customCount: customQs.length,
    timerSecs,
  });
}

function renderFavoritesView() {
  ui.setFavTab(favTab);
  if (favTab === 'saved') {
    ui.renderFavorites(getFavQs(), notes, removeFav, openNoteDialog, shareById);
  } else {
    const historyQs = getSeen().slice().reverse()
      .map(id => questionById.get(id))
      .filter(Boolean);
    ui.renderHistory(historyQs, favorites, toggleFavFromHistory, shareById);
  }
}

function getFavQs() {
  return favorites.map(id => questionById.get(id)).filter(Boolean);
}

function removeFav(id) {
  favorites = favorites.filter(f => f !== id);
  saveFavs(favorites);
  renderFavoritesView();
  ui.updateSavedChip(favorites.length);
}

function toggleFavFromHistory(id) {
  if (favorites.includes(id)) {
    favorites = favorites.filter(f => f !== id);
  } else {
    favorites.push(id);
  }
  saveFavs(favorites);
  ui.updateSavedChip(favorites.length);
  renderFavoritesView();
}

function openNoteDialog(id) {
  const q = questionById.get(id);
  ui.openNoteDialog(id, notes[id] || '', q?.question || '', (text) => {
    if (text.trim()) {
      notes[id] = text.trim();
    } else {
      delete notes[id];
    }
    saveNotes(notes);
    renderFavoritesView();
  });
}

/* ── Custom questions ───────────────────────── */
function addCustomQuestion(text, depth) {
  const nextId = customQs.length
    ? Math.max(...customQs.map(c => c.id)) + 1
    : CUSTOM_ID_BASE + 1;
  customQs.push({ id: nextId, question: text, depth });
  saveCustom(customQs);
  rebuildQuestionIndex();
  buildPool();
  ui.updateCustomCount(customQs.length);
  ui.showToast('Question added to the deck');
  if (currentView === 'settings') refreshSettings();
  // If the player had exhausted the pool, the new question revives it
  if (currentView === 'cards' && !current && !activeDeck) drawCard(true);
}

function deleteCustomQuestion(id) {
  customQs = customQs.filter(c => c.id !== id);
  saveCustom(customQs);
  favorites = favorites.filter(f => f !== id);
  saveFavs(favorites);
  delete notes[id];
  saveNotes(notes);
  delete ratings[id];
  saveRatings(ratings);
  if (seen.includes(id)) {
    seen = seen.filter(s => s !== id);
    saveSeen(seen);
  }
  rebuildQuestionIndex();
  buildPool();
  ui.renderCustomList(customQs, deleteCustomQuestion);
  ui.updateCustomCount(customQs.length);
  ui.updateSavedChip(favorites.length);
  if (currentView === 'settings') refreshSettings();
  if (current?.id === id && currentView === 'cards') drawCard(true);
}

/* ── Filters ────────────────────────────────── */
/* Adopt a new filter set: persist, rebuild, sync UI, redraw. */
function applyNewFilters(next) {
  clearDeckMode();
  filters = next;
  saveFilters(filters);
  buildPool();
  ui.updateFilterBadge(filters);
  ui.applyFiltersToChips(filters);
  ui.closeSheet();
  if (currentView === 'cards') drawCard(true);
}

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
  applyNewFilters({ categories, depths, setting: filters.setting, types: [...ALL_TYPES] });
}

function applyFiltersFromSheet() {
  const depths     = [...document.querySelectorAll('#chips-depth    .chip.active')].map(c => Number(c.dataset.val));
  const categories = [...document.querySelectorAll('#chips-category .chip.active')].map(c => c.dataset.val);
  const types      = [...document.querySelectorAll('#chips-type     .chip.active')].map(c => c.dataset.val);
  const setting    = document.querySelector('#chips-setting .seg-btn.active')?.dataset.val || 'any';

  applyNewFilters({
    depths:     depths.length     ? depths     : [1, 2, 3],
    categories: categories.length ? categories : [...ALL_CATEGORIES],
    types:      types.length      ? types      : [...ALL_TYPES],
    setting,
  });
}

/* ── Setup flow ─────────────────────────────── */
function completeSetup() {
  const settingBtn = document.querySelector('#setup-setting .setting-card.active');
  if (settingBtn) filters.setting = settingBtn.dataset.val;

  const depthBtn = document.querySelector('#setup-depth .depth-card.active');
  if (depthBtn) filters.depths = depthBtn.dataset.depths.split(',').map(Number);

  saveFilters(filters);
  players.turn = 0;
  savePlayers(players);
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
  ui.syncDeckMode(activeDeck);
  ui.syncTurnBanner(players);
  ui.els.setupView.classList.remove('active');
  navigateTo('cards');
  drawCard(true);
}

/* ── Export saved ───────────────────────────── */
function exportSaved() {
  const favQs = getFavQs();
  if (!favQs.length) return;

  const categoryLabel = s => s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const lines = favQs.map((q, i) => {
    const note = notes[q.id] ? `\n   Note: ${notes[q.id]}` : '';
    return `${i + 1}. ${q.question}\n   [${DEPTH_LABELS[q.depth]} · ${categoryLabel(q.category)} · ${q.type}]${note}`;
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
  saveSeen(seen);
  current = null;
  players = { names: [], turn: 0 };
  savePlayers(players);
  ui.renderPlayerChips(players.names, removePlayer);
  ui.stopCardTimer();
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
  ui.els.btnDecks.style.display   = 'none';
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
  ui.els.btnDoUpd.disabled        = true;
  ui.els.updateStatus.textContent = 'Clearing cache…';

  // Delete every cache, not just conv-cards-* in case any stray entries exist
  try {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => caches.delete(k)));
  } catch(e) {}

  // Unregister every SW registration, not just the known one
  if ('serviceWorker' in navigator) {
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(r => r.unregister()));
    } catch(e) {}
  }

  // Cache-bust query param forces the browser past its own HTTP cache.
  // location.reload(true) is deprecated and browsers don't reliably honor it.
  window.location.replace(location.pathname + '?r=' + Date.now());
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

  // Escape closes the topmost open layer only
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if      (document.getElementById('note-dialog').classList.contains('open')) ui.closeNoteDialog();
    else if (ui.els.customDialog.classList.contains('open')) ui.closeCustomDialog();
    else if (ui.els.resetDialog.classList.contains('open'))  ui.closeDialog();
    else if (ui.els.filterSheet.classList.contains('open'))  ui.closeSheet();
    else if (ui.els.deckSheet.classList.contains('open'))    ui.closeDeckSheet();
    else if (ui.els.customSheet.classList.contains('open'))  ui.closeCustomSheet();
  });

  // Keyboard shortcuts on the cards view
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') return;
    if (currentView !== 'cards') return;
    if (e.target.closest('input, textarea')) return;
    if (document.querySelector('.bottom-sheet.open, .dialog.open')) return;
    if (e.key === 'ArrowRight' && current) {
      e.preventDefault();
      doNext();
    } else if (e.key === 'ArrowLeft' && getSeen().length) {
      e.preventDefault();
      doUndo();
    } else if ((e.key === 's' || e.key === 'S') && current) {
      doSave();
    }
  });

  ui.els.savedChip.addEventListener('click', () => navigateTo('favorites'));

  document.getElementById('btn-start').addEventListener('click', completeSetup);

  // Players
  ui.els.btnAddPlayer.addEventListener('click', addPlayer);
  ui.els.playerInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); addPlayer(); }
  });

  const wireSingleSelect = (containerId, itemSelector) => {
    document.getElementById(containerId).addEventListener('click', e => {
      const btn = e.target.closest(itemSelector);
      if (!btn) return;
      document.querySelectorAll(itemSelector).forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
    });
  };
  wireSingleSelect('setup-setting', '.setting-card');
  wireSingleSelect('setup-depth',   '.depth-card');

  ui.els.navCards.addEventListener('click',    () => navigateTo('cards'));
  ui.els.navSaved.addEventListener('click',    () => navigateTo('favorites'));
  ui.els.navSettings.addEventListener('click', () => navigateTo('settings'));

  // Saved / History tabs
  ui.els.tabSaved.addEventListener('click',   () => { favTab = 'saved';   renderFavoritesView(); });
  ui.els.tabHistory.addEventListener('click', () => { favTab = 'history'; renderFavoritesView(); });

  ui.els.btnUndo.addEventListener('click', doUndo);
  ui.els.btnNext.addEventListener('click', doNext);
  ui.els.btnSave.addEventListener('click', doSave);

  ui.els.btnFilter.addEventListener('click', ui.openSheet);
  ui.els.scrim.addEventListener('click', ui.closeSheet);
  ui.els.btnDecks.addEventListener('click', ui.openDeckSheet);
  ui.els.deckScrim.addEventListener('click', ui.closeDeckSheet);

  const wireChipToggle = el => el.addEventListener('click', e => {
    const c = e.target.closest('.chip');
    if (c) c.classList.toggle('active');
  });
  wireChipToggle(document.getElementById('chips-depth'));
  wireChipToggle(document.getElementById('chips-category'));
  wireChipToggle(ui.els.chipsType);

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

  document.getElementById('preset-group').addEventListener('click', e => {
    const btn = e.target.closest('.preset-pill');
    if (!btn) return;
    const preset = FILTER_PRESETS.find(p => p.id === btn.dataset.preset);
    if (!preset) return;
    applyNewFilters({
      depths:     [...preset.depths],
      categories: [...preset.categories],
      setting:    preset.setting,
      types:      [...preset.types],
    });
  });

  ui.els.deckGrid.addEventListener('click', e => {
    const btn = e.target.closest('.deck-card');
    if (!btn) return;
    startDeck(btn.dataset.deck);
  });

  ui.els.btnExitDeck.addEventListener('click', exitDeck);

  ui.els.btnApply.addEventListener('click', applyFiltersFromSheet);

  ui.els.btnReset.addEventListener('click', () => {
    filters = { ...DEFAULT_FILTERS, categories: [...ALL_CATEGORIES], types: [...ALL_TYPES] };
    ui.applyFiltersToChips(filters);
  });

  ui.els.themeSeg.addEventListener('click', e => {
    const btn = e.target.closest('.seg-btn');
    if (!btn) return;
    ui.setTheme(btn.dataset.theme);
  });

  // Answer timer
  ui.els.timerSeg.addEventListener('click', e => {
    const btn = e.target.closest('.seg-btn');
    if (!btn) return;
    timerSecs = Number(btn.dataset.secs);
    saveTimer(timerSecs);
    ui.els.timerSeg.querySelectorAll('.seg-btn').forEach(b =>
      b.classList.toggle('active', b === btn));
    if (currentView === 'cards' && current) ui.startCardTimer(timerSecs);
    else if (!timerSecs) ui.stopCardTimer();
  });

  // Custom questions
  ui.els.btnAddCustom.addEventListener('click', () => ui.openCustomDialog(addCustomQuestion));
  ui.els.btnManageCustom.addEventListener('click', () => {
    ui.renderCustomList(customQs, deleteCustomQuestion);
    ui.openCustomSheet();
  });
  ui.els.customSheetScrim.addEventListener('click', ui.closeCustomSheet);
  ui.els.customCancel.addEventListener('click', ui.closeCustomDialog);
  ui.els.customScrim.addEventListener('click', ui.closeCustomDialog);
  ui.els.customAdd.addEventListener('click', ui.confirmCustomDialog);
  ui.els.customTextarea.addEventListener('input', e => {
    ui.els.customCharCount.textContent = `${e.target.value.length} / 280`;
  });
  ui.els.customDepthSeg.addEventListener('click', e => {
    const btn = e.target.closest('.seg-btn');
    if (!btn) return;
    ui.els.customDepthSeg.querySelectorAll('.seg-btn').forEach(b =>
      b.classList.toggle('active', b === btn));
  });

  // Install prompt
  ui.els.btnInstall.addEventListener('click', async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice.catch(() => null);
    installPrompt = null;
    ui.syncInstallItem(false);
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
        if (currentView === 'settings') refreshSettings();
      },
    });
  });

  ui.els.btnClearHist.addEventListener('click', () => {
    ui.openDialog({
      title: 'Clear session history?',
      body: activeDeck
        ? `This resets your progress in ${activeDeck.label} and starts the deck over.`
        : "All cards will be marked as unseen and you'll start fresh from the full deck.",
      confirmText: 'Clear history',
      cb: () => {
        setSeenList([]);
        if (currentView === 'cards') drawCard(true);
        if (currentView === 'settings') refreshSettings();
      },
    });
  });

  ui.els.btnCheckUpd.addEventListener('click', checkForUpdate);
  ui.els.btnDoUpd.addEventListener('click', performUpdate);
}

init();
