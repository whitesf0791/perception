export const STORAGE_FILTERS = 'conv_card_filters';
export const STORAGE_FAVS    = 'conv_card_favorites';
export const STORAGE_SETUP   = 'conv_card_setup_done';
export const STORAGE_THEME   = 'conv_card_theme';
export const STORAGE_NOTES   = 'conv_card_notes';
export const APP_VERSION     = '1.2.1';

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
