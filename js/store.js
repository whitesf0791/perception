export const STORAGE_FILTERS   = 'conv_card_filters';
export const STORAGE_FAVS      = 'conv_card_favorites';
export const STORAGE_SETUP     = 'conv_card_setup_done';
export const STORAGE_THEME     = 'conv_card_theme';
export const STORAGE_NOTES     = 'conv_card_notes';
export const STORAGE_SEEN      = 'conv_card_seen';
export const STORAGE_RATINGS   = 'conv_card_ratings';
export const STORAGE_PLAYERS   = 'conv_card_players';
export const STORAGE_DECK_PROG = 'conv_card_deck_progress';
export const STORAGE_CUSTOM    = 'conv_card_custom';
export const STORAGE_TIMER     = 'conv_card_timer';
export const APP_VERSION       = '1.5.0';

/* Custom question ids start here to never collide with the library */
export const CUSTOM_ID_BASE = 100000;

export const ALL_CATEGORIES = [
  'childhood', 'travel', 'work_ambition', 'values_beliefs', 'relationships',
  'hypothetical', 'humor', 'food_lifestyle', 'pop_culture', 'personal_growth',
  'dreams_future', 'random',
];
export const ALL_TYPES = [
  'memory', 'reveal', 'opinion', 'hypothetical', 'would_you_rather', 'preference', 'ranking',
];
export const DEFAULT_FILTERS = {
  categories: [...ALL_CATEGORIES],
  depths:  [1, 2, 3],
  setting: 'any',
  types:   [...ALL_TYPES],
};
export const DEPTH_LABELS = { 1: 'Light', 2: 'Moderate', 3: 'Deep' };

export const FILTER_PRESETS = [
  {
    id: 'first-date',
    label: 'First date',
    depths: [1, 2],
    categories: [...ALL_CATEGORIES],
    setting: 'any',
    types: [...ALL_TYPES],
  },
  {
    id: 'work-team',
    label: 'Work team',
    depths: [1, 2],
    categories: ALL_CATEGORIES.filter(c => c !== 'relationships'),
    setting: 'group',
    types: [...ALL_TYPES],
  },
  {
    id: 'old-friends',
    label: 'Old friends',
    depths: [1, 2, 3],
    categories: [...ALL_CATEGORIES],
    setting: 'any',
    types: [...ALL_TYPES],
  },
  {
    id: 'deep-dive',
    label: 'Deep dive',
    depths: [2, 3],
    categories: [...ALL_CATEGORIES],
    setting: 'one_on_one',
    types: [...ALL_TYPES],
  },
];

/* ── Persistence ────────────────────────────── */
function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) ?? fallback;
  } catch (e) {
    return fallback;
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function loadFilters() {
  const f = read(STORAGE_FILTERS, null);
  if (!f) return { ...DEFAULT_FILTERS, categories: [...ALL_CATEGORIES], types: [...ALL_TYPES] };
  return {
    categories: f.categories || [...ALL_CATEGORIES],
    depths:     (f.depths || [1, 2, 3]).map(Number),
    setting:    f.setting || 'any',
    types:      f.types   || [...ALL_TYPES],
  };
}

export const saveFilters      = filters   => write(STORAGE_FILTERS, filters);
export const loadFavs         = ()        => read(STORAGE_FAVS, []);
export const saveFavs         = favorites => write(STORAGE_FAVS, favorites);
export const loadNotes        = ()        => read(STORAGE_NOTES, {});
export const saveNotes        = notes     => write(STORAGE_NOTES, notes);
export const loadSeen         = ()        => read(STORAGE_SEEN, []);
export const saveSeen         = seen      => write(STORAGE_SEEN, seen);
export const loadRatings      = ()        => read(STORAGE_RATINGS, {});
export const saveRatings      = ratings   => write(STORAGE_RATINGS, ratings);
export const loadPlayers      = ()        => read(STORAGE_PLAYERS, { names: [], turn: 0 });
export const savePlayers      = players   => write(STORAGE_PLAYERS, players);
export const loadDeckProgress = ()        => read(STORAGE_DECK_PROG, {});
export const saveDeckProgress = progress  => write(STORAGE_DECK_PROG, progress);
export const loadCustom       = ()        => read(STORAGE_CUSTOM, []);
export const saveCustom       = customs   => write(STORAGE_CUSTOM, customs);
export const loadTimer        = ()        => read(STORAGE_TIMER, 0);
export const saveTimer        = secs      => write(STORAGE_TIMER, secs);
