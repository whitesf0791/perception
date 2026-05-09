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
};

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
    .setAttribute('content', isLight ? '#FFFBFE' : '#1C1B1F');
  document.querySelectorAll('#settings-theme-seg .seg-btn').forEach(btn =>
    btn.classList.toggle('active', btn.dataset.theme === mode));
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
export function updateProgress(pool, seen) {
  const unseen = pool.filter(q => !seen.includes(q.id));
  const total  = pool.length;
  const pct    = total > 0 ? Math.round((unseen.length / total) * 100) : 0;

  els.poolInfo.textContent = total > 0
    ? `${unseen.length} of ${total} remaining`
    : 'No questions match filters';

  els.progressFill.style.width = pct + '%';
  els.progressTrack.setAttribute('aria-valuenow', pct);
}

/* ── View routing ───────────────────────────── */
export function showView(name, savedCount) {
  els.cardView.classList.toggle('active',      name === 'cards');
  els.favoritesView.classList.toggle('active', name === 'favorites');
  els.settingsView.classList.toggle('active',  name === 'settings');

  els.navCards.classList.toggle('active', name === 'cards');
  els.navCards.setAttribute('aria-current', name === 'cards'     ? 'page' : 'false');
  els.navSaved.classList.toggle('active', name === 'favorites');
  els.navSaved.setAttribute('aria-current', name === 'favorites' ? 'page' : 'false');
  els.navSettings.classList.toggle('active', name === 'settings');
  els.navSettings.setAttribute('aria-current', name === 'settings' ? 'page' : 'false');

  els.btnFilter.style.display = name === 'cards' ? '' : 'none';
  els.viewTitle.textContent   = name === 'cards'     ? 'Conversation Cards'
                               : name === 'favorites' ? 'Saved'
                               : 'Settings';
  updateSavedChip(savedCount);
}

/* ── Favorites list ─────────────────────────── */
export function renderFavorites(savedQs, notes, onRemove, onNote) {
  els.favsCount.textContent = savedQs.length
    ? `${savedQs.length} question${savedQs.length !== 1 ? 's' : ''}`
    : '';

  if (!savedQs.length) {
    els.favsList.innerHTML = `
      <div class="empty-favs" role="status">
        <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24"
             fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round"
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
        </svg>
        <p class="empty-favs__headline">Nothing saved yet</p>
        <p class="empty-favs__body">Swipe left on a card or tap Save<br>to keep a question here.</p>
      </div>`;
    return;
  }

  els.favsList.innerHTML = '';
  savedQs.forEach(q => {
    const note = notes[q.id] || '';
    const notePreview = note
      ? `<p class="fav-item__note">${note.length > 80 ? note.slice(0, 78) + '…' : note}</p>`
      : '';
    const item = document.createElement('div');
    item.className = 'fav-item';
    item.setAttribute('role', 'listitem');
    item.innerHTML = `
      <div class="fav-item__depth d${q.depth}" aria-hidden="true"></div>
      <div class="fav-item__body">
        <p class="fav-item__text">${q.question}</p>
        ${notePreview}
      </div>
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
    els.favsList.appendChild(item);
  });
}

let _noteCb = null;
export function openNoteDialog(id, existingText, questionText, cb) {
  _noteCb = cb;
  const dlg      = document.getElementById('note-dialog');
  const scrim    = document.getElementById('note-scrim');
  const textarea = document.getElementById('note-textarea');
  const counter  = document.getElementById('note-char-count');
  const title    = document.getElementById('note-dialog-title');
  const qEl      = document.getElementById('note-dialog-question');
  title.textContent = existingText ? 'Edit note' : 'Add a note';
  qEl.textContent   = questionText;
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

/* ── Settings panel ─────────────────────────── */
export function updateSettingsView(favsCount, version, { poolSize = 0, seenCount = 0 } = {}) {
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
    favsCount === 0 ? 'Tap the heart to bookmark cards' : favText;
  document.getElementById('settings-seen-count').textContent =
    seenCount === 0 ? 'No cards seen yet' : `${seenCount} card${seenCount !== 1 ? 's' : ''} seen this session`;

  const btnExport = document.getElementById('btn-export-saved');
  if (btnExport) btnExport.disabled = favsCount === 0;

  document.getElementById('settings-version').textContent = `v${version}`;

  const isLight = document.documentElement.classList.contains('light');
  document.querySelectorAll('#settings-theme-seg .seg-btn').forEach(btn =>
    btn.classList.toggle('active', btn.dataset.theme === (isLight ? 'light' : 'dark')));
}

/* ── Card rendering ─────────────────────────── */
export function drawCard(q, isSaved, animate, handlers) {
  const catLabel = q.category.replace(/_/g, ' ');

  const card = document.createElement('div');
  card.className = 'card' + (animate ? ' enter' : '');
  card.setAttribute('role', 'article');
  card.innerHTML = `
    <div class="card__header">
      <div class="depth-pill d${q.depth}" aria-label="Depth: ${DEPTH_LABELS[q.depth]}">
        <span class="depth-pill__dot" aria-hidden="true"></span>
        ${DEPTH_LABELS[q.depth]}
      </div>
      <span class="card__category">${catLabel}</span>
    </div>
    <p class="card__question">${q.question}</p>
    <div class="card__footer">
      <span class="card__hint" aria-hidden="true">tap to advance · swipe to save</span>
      <span class="card__saved-icon${isSaved ? ' is-saved' : ''}"
            aria-label="${isSaved ? 'Saved' : ''}" aria-hidden="true">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
             fill="${isSaved ? 'currentColor' : 'none'}"
             stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round"
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
        </svg>
      </span>
    </div>
    <div class="swipe-label left" aria-hidden="true">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
      </svg>
      Save
    </div>
    <div class="swipe-label right" aria-hidden="true">
      Next
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path stroke-linecap="round" d="M13 7l5 5-5 5M6 12h12"/>
      </svg>
    </div>
  `;

  els.cardArea.innerHTML = '';
  els.cardArea.appendChild(card);
  els.cardActions.style.display = '';
  syncSaveBtn(isSaved);
  setupCardInteraction(card, handlers);
}

export function renderEmpty(poolSize, onRestart) {
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
      <button class="btn-filled" id="btn-pool-reset" style="max-width:180px">
        Start over
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
             fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path stroke-linecap="round" d="M4 4v5h5M20 20v-5h-5M4.93 9A10 10 0 1 0 7.6 6.3"/>
        </svg>
      </button>
    </div>`;
  els.cardActions.style.display = 'none';
  document.getElementById('btn-pool-reset').addEventListener('click', onRestart);
}

export function syncSaveBtn(isSaved) {
  els.btnSave.classList.toggle('is-saved', isSaved);
  els.btnSave.setAttribute('aria-label', isSaved ? 'Already saved' : 'Save question');
  const svg = els.btnSave.querySelector('svg');
  if (svg) svg.setAttribute('fill', isSaved ? 'currentColor' : 'none');
}

export function syncUndoBtn(visible) {
  els.btnUndo.style.display = visible ? '' : 'none';
}

/* ── Card gestures ──────────────────────────── */
export function setupCardInteraction(card, { onNext, onSave }) {
  const THRESHOLD  = 65;
  const LONG_PRESS = 480;
  const leftLabel  = card.querySelector('.swipe-label.left');
  const rightLabel = card.querySelector('.swipe-label.right');
  let startX = 0, startY = 0, dragging = false, moved = false, longTimer = null;

  function start(x, y) {
    startX = x; startY = y; dragging = true; moved = false;
    longTimer = setTimeout(() => { if (!moved) onSave(); }, LONG_PRESS);
  }

  function move(x, y) {
    if (!dragging) return;
    const dx = x - startX, dy = Math.abs(y - startY);
    if (Math.abs(dx) > 6 || dy > 6) { moved = true; clearTimeout(longTimer); }
    if (Math.abs(dx) > 8) {
      card.style.transform = `translateX(${dx * 0.38}px) rotate(${dx * 0.025}deg)`;
      const p = Math.min(1, Math.abs(dx) / THRESHOLD);
      leftLabel.style.opacity  = dx < 0 ? p : 0;
      rightLabel.style.opacity = dx > 0 ? p : 0;
    }
  }

  function end(x) {
    if (!dragging) return;
    dragging = false; clearTimeout(longTimer);
    const dx = x - startX;
    if (Math.abs(dx) > THRESHOLD) {
      dx < 0 ? exitCard(card, 'left', onSave) : exitCard(card, 'right', onNext);
    } else if (!moved) {
      card.style.transform = '';
      leftLabel.style.opacity = rightLabel.style.opacity = 0;
      onNext();
    } else {
      card.style.transform = '';
      leftLabel.style.opacity = rightLabel.style.opacity = 0;
    }
  }

  card.addEventListener('mousedown',  e => start(e.clientX, e.clientY));
  card.addEventListener('mousemove',  e => { if (dragging) move(e.clientX, e.clientY); });
  card.addEventListener('mouseup',    e => end(e.clientX));
  card.addEventListener('mouseleave', e => { if (dragging) end(e.clientX); });
  card.addEventListener('touchstart', e => { const t = e.touches[0]; start(t.clientX, t.clientY); }, { passive: true });
  card.addEventListener('touchmove',  e => { const t = e.touches[0]; move(t.clientX, t.clientY); },  { passive: true });
  card.addEventListener('touchend',   e => { const t = e.changedTouches[0]; end(t.clientX); });
}

export function exitCard(card, direction, callback) {
  card.style.transform = '';
  card.classList.add(direction === 'left' ? 'exit-left' : 'exit-right');
  setTimeout(callback, 280);
}

/* ── Filter sheet ───────────────────────────── */
export function openSheet() {
  els.filterSheet.classList.add('open');
  els.scrim.classList.add('open');
  els.scrim.removeAttribute('aria-hidden');
}

export function closeSheet() {
  els.filterSheet.classList.remove('open');
  els.scrim.classList.remove('open');
  els.scrim.setAttribute('aria-hidden', 'true');
}

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
