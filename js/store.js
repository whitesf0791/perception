export const STORAGE_FILTERS = 'conv_card_filters';
export const STORAGE_FAVS    = 'conv_card_favorites';
export const STORAGE_SETUP   = 'conv_card_setup_done';
export const STORAGE_THEME   = 'conv_card_theme';
export const STORAGE_NOTES   = 'conv_card_notes';
export const STORAGE_SEEN    = 'conv_card_seen';
export const STORAGE_RATINGS = 'conv_card_ratings';
export const APP_VERSION     = '1.3.7';

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

export function loadFilters() {
  try {
    const raw = localStorage.getItem(STORAGE_FILTERS);
    if (raw) {
      const f = JSON.parse(raw);
      return {
        categories: f.categories || [...ALL_CATEGORIES],
        depths:     (f.depths || [1, 2, 3]).map(Number),
        setting:    f.setting || 'any',
        types:      f.types   || [...ALL_TYPES],
      };
    }
  } catch(e) { /* ignore */ }
  return { ...DEFAULT_FILTERS, categories: [...ALL_CATEGORIES], types: [...ALL_TYPES] };
}

export function saveFilters(filters) {
  localStorage.setItem(STORAGE_FILTERS, JSON.stringify(filters));
}

export function loadFavs() {
  try { return JSON.parse(localStorage.getItem(STORAGE_FAVS)) || []; }
  catch(e) { return []; }
}

export function saveFavs(favorites) {
  localStorage.setItem(STORAGE_FAVS, JSON.stringify(favorites));
}

export function loadNotes() {
  try { return JSON.parse(localStorage.getItem(STORAGE_NOTES)) || {}; }
  catch(e) { return {}; }
}

export function saveNotes(notes) {
  localStorage.setItem(STORAGE_NOTES, JSON.stringify(notes));
}

export function loadSeen() {
  try { return JSON.parse(localStorage.getItem(STORAGE_SEEN)) || []; }
  catch(e) { return []; }
}

export function saveSeen(seen) {
  localStorage.setItem(STORAGE_SEEN, JSON.stringify(seen));
}

export function loadRatings() {
  try { return JSON.parse(localStorage.getItem(STORAGE_RATINGS)) || {}; }
  catch(e) { return {}; }
}

export function saveRatings(ratings) {
  localStorage.setItem(STORAGE_RATINGS, JSON.stringify(ratings));
}
