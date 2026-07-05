import { STORAGE_THEME, ALL_CATEGORIES, ALL_TYPES, DEPTH_LABELS } from './store.js';

/* ── DOM refs ───────────────────────────────── */
export const els = {
  setupView:    document.getElementById('setup-view'),
  cardView:     document.getElementById('card-view'),
  favoritesView:document.getElementById('favorites-view'),
  settingsView: document.getElementById('settings-view'),
  navBar:       document.getElementById('nav-bar'),
  navCards:     document.getElementById('nav-cards'),
  navSaved:     document.getElementById('nav-saved'),
  navSettings:  document.getElementById('nav-settings'),
  cardArea:     document.getElementById('card-area'),
  cardActions:  document.getElementById('card-actions'),
  poolInfo:     document.getElementById('pool-info'),
  progressFill: document.getElementById('progress-fill'),
  progressTrack:document.getElementById('progress-track'),
  btnUndo:      document.getElementById('btn-undo'),
  btnSave:      document.getElementById('btn-save'),
  btnNext:      document.getElementById('btn-next'),
  btnFilter:    document.getElementById('btn-filter'),
  filterBadge:  document.getElementById('filter-badge'),
  viewTitle:    document.getElementById('view-title'),
  favsList:     document.getElementById('favorites-list'),
  favsCount:    document.getElementById('favs-count'),
  scrim:        document.getElementById('scrim'),
  filterSheet:  document.getElementById('filter-sheet'),
  btnApply:     document.getElementById('btn-apply-filters'),
  btnReset:     document.getElementById('btn-reset-filters'),
  btnSurprise:  document.getElementById('btn-surprise'),
  typeLabel:    document.getElementById('type-label'),
  chipsType:    document.getElementById('chips-type'),
  btnNewSess:   document.getElementById('btn-new-session'),
  savedChip:    document.getElementById('saved-chip'),
  savedChipCnt: document.getElementById('saved-chip-count'),
  dialogScrim:  document.getElementById('dialog-scrim'),
  resetDialog:  document.getElementById('reset-dialog'),
  dialogCancel: document.getElementById('dialog-cancel'),
  dialogConf:   document.getElementById('dialog-confirm'),
  btnExportSaved:document.getElementById('btn-export-saved'),
  btnClearSaved:document.getElementById('btn-clear-saved'),
  btnClearHist: document.getElementById('btn-clear-history'),
  btnCheckUpd:  document.getElementById('btn-check-update'),
  btnDoUpd:     document.getElementById('btn-do-update'),
  updateStatus: document.getElementById('update-status'),
  themeSeg:     document.getElementById('settings-theme-seg'),
  deckSheet:    document.getElementById('deck-sheet'),
  deckScrim:    document.getElementById('deck-scrim'),
  btnDecks:     document.getElementById('btn-decks'),
  btnExitDeck:  document.getElementById('btn-exit-deck'),
  deckGrid:     document.getElementById('deck-grid'),
  // v1.5.0
  turnBanner:   document.getElementById('turn-banner'),
  turnLabel:    document.getElementById('turn-label'),
  srQuestion:   document.getElementById('sr-question'),
  tabSaved:     document.getElementById('tab-saved'),
  tabHistory:   document.getElementById('tab-history'),
  timerSeg:     document.getElementById('timer-seg'),
  customCount:  document.getElementById('settings-custom-count'),
  btnAddCustom: document.getElementById('btn-add-custom'),
  btnManageCustom: document.getElementById('btn-manage-custom'),
  customDialog: document.getElementById('custom-dialog'),
  customScrim:  document.getElementById('custom-scrim'),
  customTextarea: document.getElementById('custom-textarea'),
  customCharCount: document.getElementById('custom-char-count'),
  customDepthSeg: document.getElementById('custom-depth-seg'),
  customCancel: document.getElementById('custom-cancel'),
  customAdd:    document.getElementById('custom-add'),
  customSheet:  document.getElementById('custom-sheet'),
  customSheetScrim: document.getElementById('custom-sheet-scrim'),
  customList:   document.getElementById('custom-list'),
  installItem:  document.getElementById('install-item'),
  btnInstall:   document.getElementById('btn-install'),
  playerInput:  document.getElementById('player-input'),
  btnAddPlayer: document.getElementById('btn-add-player'),
  playerChips:  document.getElementById('player-chips'),
  toast:        document.getElementById('toast'),
};

/* Escape user-controlled text before innerHTML interpolation */
const esc = s => String(s).replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const buzz = ms => { try { navigator.vibrate?.(ms); } catch (e) { /* unsupported */ } };

const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── Theme ──────────────────────────────────── */
export function loadTheme() {
  if (localStorage.getItem(STORAGE_THEME) === 'light') {
    document.documentElement.classList.add('light');
  }
}

export function setTheme(mode) {
  const isLight = mode === 'light';
  document.documentElement.classList.toggle('light', isLight);
  localStorage.setItem(STORAGE_THEME, mode);
  document.querySelector('meta[name="theme-color"]')
    .setAttribute('content', isLight ? '#FFF8F2' : '#1A1612');
  document.querySelectorAll('#settings-theme-seg .seg-btn').forEach(btn =>
    btn.classList.toggle('active', btn.dataset.theme === mode));
}

/* ── Toast ──────────────────────────────────── */
let _toastTimer = null;
export function showToast(msg) {
  els.toast.textContent = msg;
  els.toast.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => els.toast.classList.remove('show'), 2200);
}

/* ── Dialog ─────────────────────────────────── */
let _dialogCb = null;

export function openDialog({ title, body, confirmText, cb }) {
  document.getElementById('dialog-title').textContent     = title;
  document.getElementById('dialog-body-text').textContent = body;
  els.dialogConf.textContent = confirmText;
  _dialogCb = cb;
  els.resetDialog.removeAttribute('aria-hidden');
  els.dialogScrim.removeAttribute('aria-hidden');
  els.dialogScrim.classList.add('open');
  els.resetDialog.classList.add('open');
  els.dialogConf.focus();
}

export function closeDialog() {
  _dialogCb = null;
  els.resetDialog.setAttribute('aria-hidden', 'true');
  els.dialogScrim.setAttribute('aria-hidden', 'true');
  els.dialogScrim.classList.remove('open');
  els.resetDialog.classList.remove('open');
}

export function confirmDialogAction() {
  const cb = _dialogCb;
  closeDialog();
  if (cb) cb();
}

/* ── Saved chip ─────────────────────────────── */
export function updateSavedChip(n) {
  els.savedChipCnt.textContent = n;
  els.savedChip.style.display  = n > 0 ? '' : 'none';
}

/* ── Progress bar ───────────────────────────── */
export function updateProgress(pool, seen, deck = null) {
  let text, pct;
  if (deck) {
    const total      = deck.ids.length;
    const deckIds    = new Set(deck.ids);
    const seenInDeck = seen.filter(id => deckIds.has(id)).length;
    pct  = total > 0 ? Math.round((seenInDeck / total) * 100) : 0;
    text = `${deck.label} · ${seenInDeck} of ${total}`;
  } else {
    const seenSet = new Set(seen);
    const unseen  = pool.filter(q => !seenSet.has(q.id)).length;
    const total   = pool.length;
    pct  = total > 0 ? Math.round((unseen / total) * 100) : 0;
    text = total > 0 ? `${unseen} of ${total} remaining` : 'No questions match filters';
  }
  els.poolInfo.textContent = text;
  els.progressFill.style.width = pct + '%';
  els.progressTrack.setAttribute('aria-valuenow', pct);
}

/* ── Turn banner ────────────────────────────── */
export function syncTurnBanner(players) {
  const active = players.names.length >= 2;
  els.turnBanner.style.display = active ? '' : 'none';
  if (active) {
    const name = players.names[players.turn % players.names.length];
    els.turnLabel.textContent = `${name}'s turn`;
  }
}

/* ── Players (setup) ────────────────────────── */
export function renderPlayerChips(names, onRemove) {
  els.playerChips.innerHTML = '';
  names.forEach((name, i) => {
    const chip = document.createElement('span');
    chip.className = 'player-chip';
    chip.setAttribute('role', 'listitem');
    chip.innerHTML = `
      ${esc(name)}
      <button class="player-chip__remove" aria-label="Remove ${esc(name)}">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
             fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
          <path stroke-linecap="round" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>`;
    chip.querySelector('.player-chip__remove').addEventListener('click', () => onRemove(i));
    els.playerChips.appendChild(chip);
  });
}

/* ── View routing ───────────────────────────── */
export function showView(name, savedCount) {
  els.cardView.classList.toggle('active',      name === 'cards');
  els.favoritesView.classList.toggle('active', name === 'favorites');
  els.settingsView.classList.toggle('active',  name === 'settings');

  const navMap = [[els.navCards, 'cards'], [els.navSaved, 'favorites'], [els.navSettings, 'settings']];
  navMap.forEach(([btn, view]) => {
    btn.classList.toggle('active', name === view);
    btn.setAttribute('aria-current', name === view ? 'page' : 'false');
  });

  els.btnFilter.style.display = name === 'cards' ? '' : 'none';
  els.btnDecks.style.display  = name === 'cards' ? '' : 'none';
  els.viewTitle.textContent   = name === 'cards'     ? 'Cards'
                               : name === 'favorites' ? 'Saved'
                               : 'Settings';
  updateSavedChip(savedCount);
}

/* ── Saved / History tabs ───────────────────── */
export function setFavTab(tab) {
  els.tabSaved.classList.toggle('active',   tab === 'saved');
  els.tabSaved.setAttribute('aria-selected',   String(tab === 'saved'));
  els.tabHistory.classList.toggle('active', tab === 'history');
  els.tabHistory.setAttribute('aria-selected', String(tab === 'history'));
}

/* ── Favorites list ─────────────────────────── */
const SHARE_SVG = `
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
       fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
    <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
  </svg>`;

const HEART_PATH = 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z';

export function renderFavorites(savedQs, notes, onRemove, onNote, onShare) {
  els.favsCount.textContent = savedQs.length
    ? `${savedQs.length} question${savedQs.length !== 1 ? 's' : ''}`
    : '';

  if (!savedQs.length) {
    els.favsList.innerHTML = `
      <div class="empty-favs" role="status">
        <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24"
             fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="${HEART_PATH}"/>
        </svg>
        <p class="empty-favs__headline">Nothing saved yet</p>
        <p class="empty-favs__body">Tap Save on a card<br>to keep a question here.</p>
      </div>`;
    return;
  }

  els.favsList.innerHTML = '';
  savedQs.forEach(q => {
    const note = notes[q.id] || '';
    const notePreview = note
      ? `<p class="fav-item__note">${esc(note.length > 80 ? note.slice(0, 78) + '…' : note)}</p>`
      : '';
    const item = document.createElement('div');
    item.className = 'fav-item';
    item.setAttribute('role', 'listitem');
    item.innerHTML = `
      <div class="fav-item__depth d${q.depth}" aria-hidden="true"></div>
      <div class="fav-item__body">
        <p class="fav-item__text">${esc(q.question)}</p>
        ${notePreview}
      </div>
      <button class="fav-item__action fav-share" data-id="${q.id}" aria-label="Share question">
        ${SHARE_SVG}
      </button>
      <button class="fav-item__note-btn${note ? ' has-note' : ''}" data-id="${q.id}" aria-label="${note ? 'Edit note' : 'Add note'}">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
             fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round"
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
        </svg>
      </button>
      <button class="fav-item__remove" data-id="${q.id}" aria-label="Remove from saved">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
             fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path stroke-linecap="round" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>`;
    item.querySelector('.fav-item__remove').addEventListener('click', e => {
      onRemove(Number(e.currentTarget.dataset.id));
    });
    item.querySelector('.fav-item__note-btn').addEventListener('click', e => {
      onNote(Number(e.currentTarget.dataset.id));
    });
    item.querySelector('.fav-share').addEventListener('click', e => {
      onShare(Number(e.currentTarget.dataset.id));
    });
    els.favsList.appendChild(item);
  });
}

/* ── History list ───────────────────────────── */
export function renderHistory(historyQs, favorites, onToggleSave, onShare) {
  els.favsCount.textContent = historyQs.length
    ? `${historyQs.length} card${historyQs.length !== 1 ? 's' : ''} seen · most recent first`
    : '';

  if (!historyQs.length) {
    els.favsList.innerHTML = `
      <div class="empty-favs" role="status">
        <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24"
             fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
          <circle cx="12" cy="12" r="9"/>
          <path stroke-linecap="round" d="M12 7v5l3 3"/>
        </svg>
        <p class="empty-favs__headline">No history yet</p>
        <p class="empty-favs__body">Questions you've been through<br>this session will appear here.</p>
      </div>`;
    return;
  }

  els.favsList.innerHTML = '';
  historyQs.forEach(q => {
    const isSaved = favorites.includes(q.id);
    const item = document.createElement('div');
    item.className = 'fav-item';
    item.setAttribute('role', 'listitem');
    item.innerHTML = `
      <div class="fav-item__depth d${q.depth}" aria-hidden="true"></div>
      <div class="fav-item__body">
        <p class="fav-item__text">${esc(q.question)}</p>
      </div>
      <button class="fav-item__action fav-share" data-id="${q.id}" aria-label="Share question">
        ${SHARE_SVG}
      </button>
      <button class="fav-item__action fav-heart${isSaved ? ' is-saved' : ''}" data-id="${q.id}"
              aria-label="${isSaved ? 'Remove from saved' : 'Save question'}" aria-pressed="${isSaved}">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
             fill="${isSaved ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="${HEART_PATH}"/>
        </svg>
      </button>`;
    item.querySelector('.fav-share').addEventListener('click', e => {
      onShare(Number(e.currentTarget.dataset.id));
    });
    item.querySelector('.fav-heart').addEventListener('click', e => {
      onToggleSave(Number(e.currentTarget.dataset.id));
    });
    els.favsList.appendChild(item);
  });
}

/* ── Note dialog ────────────────────────────── */
let _noteCb = null;
export function openNoteDialog(id, existingText, questionText, cb) {
  _noteCb = cb;
  const dlg      = document.getElementById('note-dialog');
  const scrim    = document.getElementById('note-scrim');
  const textarea = document.getElementById('note-textarea');
  const counter  = document.getElementById('note-char-count');
  document.getElementById('note-dialog-title').textContent    = existingText ? 'Edit note' : 'Add a note';
  document.getElementById('note-dialog-question').textContent = questionText;
  textarea.value = existingText;
  counter.textContent = `${existingText.length} / 500`;
  dlg.setAttribute('aria-hidden', 'false');
  dlg.classList.add('open');
  scrim.setAttribute('aria-hidden', 'false');
  scrim.classList.add('open');
  textarea.focus();
}

export function closeNoteDialog() {
  const dlg   = document.getElementById('note-dialog');
  const scrim = document.getElementById('note-scrim');
  dlg.classList.remove('open');
  dlg.setAttribute('aria-hidden', 'true');
  scrim.classList.remove('open');
  scrim.setAttribute('aria-hidden', 'true');
  _noteCb = null;
}

export function confirmNoteDialog() {
  const text = document.getElementById('note-textarea').value;
  if (_noteCb) _noteCb(text);
  closeNoteDialog();
}

/* ── Custom question dialog ─────────────────── */
let _customCb = null;

export function openCustomDialog(cb) {
  _customCb = cb;
  els.customTextarea.value = '';
  els.customCharCount.textContent = '0 / 280';
  els.customDepthSeg.querySelectorAll('.seg-btn').forEach((b, i) =>
    b.classList.toggle('active', i === 0));
  els.customDialog.setAttribute('aria-hidden', 'false');
  els.customDialog.classList.add('open');
  els.customScrim.setAttribute('aria-hidden', 'false');
  els.customScrim.classList.add('open');
  els.customTextarea.focus();
}

export function closeCustomDialog() {
  els.customDialog.classList.remove('open');
  els.customDialog.setAttribute('aria-hidden', 'true');
  els.customScrim.classList.remove('open');
  els.customScrim.setAttribute('aria-hidden', 'true');
  _customCb = null;
}

export function confirmCustomDialog() {
  const text  = els.customTextarea.value.trim();
  const depth = Number(els.customDepthSeg.querySelector('.seg-btn.active')?.dataset.depth || 1);
  const cb = _customCb;
  closeCustomDialog();
  if (cb && text) cb(text, depth);
}

/* ── Custom questions manage sheet ──────────── */
export function renderCustomList(customs, onDelete) {
  if (!customs.length) {
    els.customList.innerHTML =
      `<p class="custom-empty">No custom questions yet.<br>Add one from Settings and it joins the deck.</p>`;
    return;
  }
  els.customList.innerHTML = '';
  customs.forEach(c => {
    const row = document.createElement('div');
    row.className = 'custom-item';
    row.innerHTML = `
      <div class="custom-item__depth" style="background:var(--depth${c.depth}-color)" aria-hidden="true"></div>
      <p class="custom-item__text">${esc(c.question)}</p>
      <button class="custom-item__remove" data-id="${c.id}" aria-label="Delete question">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
             fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round"
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
        </svg>
      </button>`;
    row.querySelector('.custom-item__remove').addEventListener('click', e => {
      onDelete(Number(e.currentTarget.dataset.id));
    });
    els.customList.appendChild(row);
  });
}

export function updateCustomCount(n) {
  els.customCount.textContent = n === 0
    ? 'Write your own — they join the deck'
    : `${n} custom question${n !== 1 ? 's' : ''} in the deck`;
}

/* ── Install prompt ─────────────────────────── */
export function syncInstallItem(available) {
  els.installItem.style.display = available ? '' : 'none';
}

/* ── Settings panel ─────────────────────────── */
export function updateSettingsView(favsCount, version, { poolSize = 0, seenCount = 0, customCount = 0, timerSecs = 0 } = {}) {
  const favText = favsCount === 0
    ? 'Nothing saved yet'
    : `${favsCount} question${favsCount !== 1 ? 's' : ''} saved`;

  // Session group
  const remaining = poolSize - seenCount;
  document.getElementById('settings-deck-progress').textContent =
    poolSize === 0
      ? 'No deck loaded'
      : `${remaining} of ${poolSize} remaining · ${seenCount} seen`;
  document.getElementById('settings-saved-count').textContent = favText;

  // Your data group
  document.getElementById('settings-saved-count-data').textContent =
    favsCount === 0 ? 'Tap Save to bookmark cards' : favText;
  document.getElementById('settings-seen-count').textContent =
    seenCount === 0 ? 'No cards seen yet' : `${seenCount} card${seenCount !== 1 ? 's' : ''} seen this session`;

  els.btnExportSaved.disabled = favsCount === 0;

  updateCustomCount(customCount);

  els.timerSeg.querySelectorAll('.seg-btn').forEach(btn =>
    btn.classList.toggle('active', Number(btn.dataset.secs) === timerSecs));

  document.getElementById('settings-version').textContent = `v${version}`;

  const isLight = document.documentElement.classList.contains('light');
  document.querySelectorAll('#settings-theme-seg .seg-btn').forEach(btn =>
    btn.classList.toggle('active', btn.dataset.theme === (isLight ? 'light' : 'dark')));
}

/* ── Card rendering ─────────────────────────── */
export function drawCard(q, isSaved, animate, { onNext, onSave, onUndo, onRate, onShare, rating = 0 }) {
  const card = document.createElement('div');
  card.className = 'card' + (animate ? ' enter' : '');
  card.setAttribute('role', 'article');
  card.innerHTML = `
    <div class="card__header">
      <div class="depth-pill d${q.depth}" aria-label="Depth: ${DEPTH_LABELS[q.depth]}">
        <span class="depth-pill__dot" aria-hidden="true"></span>
        ${DEPTH_LABELS[q.depth]}
      </div>
      ${q.custom ? '<span class="custom-badge">Yours</span>' : ''}
    </div>
    <p class="card__question">${esc(q.question)}</p>
    <div class="card__footer">
      <div class="card__rating" role="group" aria-label="Rate this question">
        <button class="rating-btn rating-btn--down${rating === -1 ? ' is-active' : ''}"
                aria-label="Less of this" aria-pressed="${rating === -1}">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
               fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M10 15v4a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3H10z"/>
            <path stroke-linecap="round" stroke-linejoin="round" d="M17 2h2.67A2.31 2.31 0 0122 4v7a2.31 2.31 0 01-2.33 2H17"/>
          </svg>
        </button>
        <button class="rating-btn rating-btn--up${rating === 1 ? ' is-active' : ''}"
                aria-label="More of this" aria-pressed="${rating === 1}">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
               fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z"/>
            <path stroke-linecap="round" stroke-linejoin="round" d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"/>
          </svg>
        </button>
      </div>
      <div class="card__footer-right">
        <button class="rating-btn card-share" aria-label="Share question">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
               fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
        </button>
        <span class="card__saved-icon${isSaved ? ' is-saved' : ''}" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
               fill="${isSaved ? 'currentColor' : 'none'}"
               stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="${HEART_PATH}"/>
          </svg>
        </span>
      </div>
    </div>
    <div class="swipe-label left" aria-hidden="true">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 18l-6-6 6-6"/>
      </svg>
      Back
    </div>
    <div class="swipe-label right" aria-hidden="true">
      Next
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 18l6-6-6-6"/>
      </svg>
    </div>
  `;

  els.cardArea.innerHTML = '';
  els.cardArea.appendChild(card);
  els.cardActions.style.display = '';
  els.srQuestion.textContent = q.question;
  syncSaveBtn(isSaved);
  setupCardInteraction(card, { onNext, onSave, onUndo, onRate, onShare });
}

export function renderEmpty(poolSize, onRestart) {
  stopCardTimer();
  els.cardArea.innerHTML = `
    <div class="empty-state" role="status">
      <svg class="empty-state__icon" xmlns="http://www.w3.org/2000/svg"
           width="64" height="64" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" stroke-width="1.5" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round"
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <p class="empty-state__headline">You’ve seen them all</p>
      <p class="empty-state__body">${poolSize} question${poolSize !== 1 ? 's' : ''} in this filter.<br>Start over or adjust your filters.</p>
      <div class="empty-state__actions">
        <button class="btn-filled" id="btn-pool-reset">
          Start over
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
               fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" d="M4 4v5h5M20 20v-5h-5M4.93 9A10 10 0 1 0 7.6 6.3"/>
          </svg>
        </button>
      </div>
    </div>`;
  els.cardActions.style.display = 'none';
  document.getElementById('btn-pool-reset').addEventListener('click', onRestart);
}

export function renderDeckComplete(label, onRestart, onExit) {
  stopCardTimer();
  els.cardArea.innerHTML = `
    <div class="empty-state" role="status">
      <svg class="empty-state__icon" xmlns="http://www.w3.org/2000/svg"
           width="64" height="64" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" stroke-width="1.5" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round"
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <p class="empty-state__headline">${esc(label)} complete</p>
      <p class="empty-state__body">You've been through all the cards in this deck.</p>
      <div class="empty-state__actions">
        <button class="btn-outlined" id="btn-deck-exit">Free play</button>
        <button class="btn-filled"   id="btn-deck-restart">
          Go again
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
               fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" d="M4 4v5h5M20 20v-5h-5M4.93 9A10 10 0 1 0 7.6 6.3"/>
          </svg>
        </button>
      </div>
    </div>`;
  els.cardActions.style.display = 'none';
  document.getElementById('btn-deck-restart').addEventListener('click', onRestart);
  document.getElementById('btn-deck-exit').addEventListener('click', onExit);
}

/* ── Card timer ─────────────────────────────── */
let _timerInterval = null;

export function stopCardTimer() {
  clearInterval(_timerInterval);
  _timerInterval = null;
}

export function startCardTimer(secs) {
  stopCardTimer();
  const card = els.cardArea.querySelector('.card');
  const old  = card?.querySelector('.card-timer');
  if (old) old.remove();
  if (!secs || !card) return;

  const bar = document.createElement('div');
  bar.className = 'card-timer';
  bar.innerHTML = '<div class="card-timer__fill"></div>';
  card.appendChild(bar);
  const fill  = bar.firstElementChild;
  const start = Date.now();

  _timerInterval = setInterval(() => {
    if (!bar.isConnected) { stopCardTimer(); return; }
    const p = Math.min(1, (Date.now() - start) / (secs * 1000));
    fill.style.width = (p * 100) + '%';
    if (p >= 1) {
      stopCardTimer();
      bar.classList.add('is-done');
      buzz(30);
    }
  }, 250);
}

/* ── Card state sync ────────────────────────── */
export function syncSaveBtn(isSaved) {
  els.btnSave.classList.toggle('is-saved', isSaved);
  els.btnSave.setAttribute('aria-label', isSaved ? 'Already saved' : 'Save question');
  const svg = els.btnSave.querySelector('svg');
  if (svg) svg.setAttribute('fill', isSaved ? 'currentColor' : 'none');
}

/* Heart indicator on the card itself */
export function syncSavedIcon(isSaved) {
  const icon = els.cardArea.querySelector('.card__saved-icon');
  if (!icon) return;
  icon.classList.toggle('is-saved', isSaved);
  const svg = icon.querySelector('svg');
  if (svg) svg.setAttribute('fill', isSaved ? 'currentColor' : 'none');
}

export function syncUndoBtn(visible) {
  els.btnUndo.style.display = visible ? '' : 'none';
}

export function syncRatingBtns(value) {
  const card = els.cardArea.querySelector('.card');
  if (!card) return;
  const up   = card.querySelector('.rating-btn--up');
  const down = card.querySelector('.rating-btn--down');
  if (up)   { up.classList.toggle('is-active',   value === 1);  up.setAttribute('aria-pressed',   String(value === 1)); }
  if (down) { down.classList.toggle('is-active', value === -1); down.setAttribute('aria-pressed', String(value === -1)); }
}

export function syncDeckMode(deck) {
  const active = !!deck;
  els.btnExitDeck.style.display = active ? '' : 'none';
  els.btnFilter.style.display   = active ? 'none' : '';
  els.btnDecks.style.display    = active ? 'none' : '';
  document.querySelectorAll('.deck-card').forEach(c =>
    c.classList.toggle('is-active', c.dataset.deck === deck?.id));
}

/* ── Card gestures ──────────────────────────── */
export function setupCardInteraction(card, { onNext, onSave, onUndo, onRate, onShare }) {
  const THRESHOLD  = 65;
  const leftLabel  = card.querySelector('.swipe-label.left');
  const rightLabel = card.querySelector('.swipe-label.right');
  let startX = 0, startY = 0, dragging = false, moved = false;

  card.querySelector('.rating-btn--up').addEventListener('click',   () => onRate(1));
  card.querySelector('.rating-btn--down').addEventListener('click', () => onRate(-1));
  card.querySelector('.card-share').addEventListener('click', () => onShare());

  function reset() {
    card.style.transform = '';
    leftLabel.style.opacity = rightLabel.style.opacity = 0;
  }

  function start(x, y, target) {
    if (target?.closest('.rating-btn')) return;
    startX = x; startY = y; dragging = true; moved = false;
  }

  function move(x, y) {
    if (!dragging) return;
    const dx = x - startX, dy = Math.abs(y - startY);
    if (Math.abs(dx) > 6 || dy > 6) moved = true;
    if (Math.abs(dx) > 8) {
      card.style.transform = `translateX(${dx * 0.38}px) rotate(${dx * 0.025}deg)`;
      const p = Math.min(1, Math.abs(dx) / THRESHOLD);
      leftLabel.style.opacity  = dx < 0 && onUndo ? p : 0;
      rightLabel.style.opacity = dx > 0 ? p : 0;
    }
  }

  function end(x) {
    if (!dragging) return;
    dragging = false;
    const dx = x - startX;
    if (Math.abs(dx) > THRESHOLD) {
      if (dx > 0) {
        buzz(10);
        exitCard(card, 'right', onNext);
      } else if (onUndo) {
        buzz(10);
        exitCard(card, 'left', onUndo);
      } else {
        reset();
      }
    } else if (!moved) {
      reset();
      onNext();
    } else {
      reset();
    }
  }

  card.addEventListener('mousedown',  e => start(e.clientX, e.clientY, e.target));
  card.addEventListener('mousemove',  e => { if (dragging) move(e.clientX, e.clientY); });
  card.addEventListener('mouseup',    e => end(e.clientX));
  card.addEventListener('mouseleave', e => { if (dragging) end(e.clientX); });
  card.addEventListener('touchstart', e => { const t = e.touches[0]; start(t.clientX, t.clientY, e.target); }, { passive: true });
  card.addEventListener('touchmove',  e => { const t = e.touches[0]; move(t.clientX, t.clientY); },  { passive: true });
  card.addEventListener('touchend',   e => { const t = e.changedTouches[0]; end(t.clientX); });
}

export function exitCard(card, direction, callback) {
  card.style.transform = '';
  card.classList.add(direction === 'left' ? 'exit-left' : 'exit-right');
  setTimeout(callback, prefersReducedMotion() ? 0 : 280);
}

/* ── Bottom sheets ──────────────────────────── */
function setSheet(sheet, scrim, open) {
  sheet.classList.toggle('open', open);
  scrim.classList.toggle('open', open);
  if (open) scrim.removeAttribute('aria-hidden');
  else      scrim.setAttribute('aria-hidden', 'true');
}

export const openSheet        = () => setSheet(els.filterSheet, els.scrim, true);
export const closeSheet       = () => setSheet(els.filterSheet, els.scrim, false);
export const openDeckSheet    = () => setSheet(els.deckSheet, els.deckScrim, true);
export const closeDeckSheet   = () => setSheet(els.deckSheet, els.deckScrim, false);
export const openCustomSheet  = () => setSheet(els.customSheet, els.customSheetScrim, true);
export const closeCustomSheet = () => setSheet(els.customSheet, els.customSheetScrim, false);

/* ── Filter chips ───────────────────────────── */
export function updateFilterBadge(filters) {
  const isDefault =
    filters.depths.length    === 3 &&
    filters.categories.length === ALL_CATEGORIES.length &&
    filters.types.length      === ALL_TYPES.length &&
    filters.setting           === 'any';
  els.filterBadge.classList.toggle('visible', !isDefault);
}

export function applyFiltersToChips(filters) {
  document.querySelectorAll('#chips-depth    .chip').forEach(c =>
    c.classList.toggle('active', filters.depths.includes(Number(c.dataset.val))));
  document.querySelectorAll('#chips-category .chip').forEach(c =>
    c.classList.toggle('active', filters.categories.includes(c.dataset.val)));
  document.querySelectorAll('#chips-type     .chip').forEach(c =>
    c.classList.toggle('active', filters.types.includes(c.dataset.val)));
  document.querySelectorAll('#chips-setting  .seg-btn').forEach(c =>
    c.classList.toggle('active', c.dataset.val === filters.setting));
}

export function toggleTypeSection() {
  const collapsed = els.typeLabel.classList.toggle('collapsed');
  els.chipsType.classList.toggle('hidden', collapsed);
  els.typeLabel.setAttribute('aria-expanded', String(!collapsed));
}
