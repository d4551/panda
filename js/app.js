/**
 * Panda Professor — Chengdu Tours App Logic
 * Refactored to use PandaDB (localForage/IndexedDB) as the data source.
 */

const { translations: appTranslations } = window.appData;

/** @type {Array} Live data populated async from PandaDB */
let liveTours = [];
let liveReviews = [];
let liveFaqs = [];
let liveFacts = [];

/**
 * Theme options shown in the header selector.
 * Includes Panda-inspired palette choices for travel branding.
 */
const THEME_OPTIONS = [
  { value: "emerald", labelKey: "themeEmerald" },
  { value: "forest", labelKey: "themeForest" },
  { value: "bamboo", labelKey: "themeBamboo" }
];

/** @type {string[]} */
const THEME_VALUES = THEME_OPTIONS.map((theme) => theme.value);
const THEME_FALLBACK = "emerald";

const PLAN_STORAGE_KEY = 'pp_plan';
const DEFAULT_PARTICIPANTS = 2;
const MIN_PARTICIPANTS = 1;
const MAX_PARTICIPANTS = 20;

const PLAN_DEFAULT_TIME_SLOTS = {
  en: ['09:00', '14:00', '19:00'],
  zh: ['09:00', '14:00', '19:00']
};

/**
 * Normalize panda facts to ensure each fact has a stable identifier.
 * @param {*} rawFacts
 * @returns {Array<{id:string,textEn:string,textZh:string}>}
 */
function normalizeFacts(rawFacts) {
  if (!Array.isArray(rawFacts)) return [];

  return rawFacts
    .map((fact, index) => {
      if (!fact || typeof fact !== 'object') return null;

      const textEn = typeof fact.textEn === 'string' ? fact.textEn : '';
      const textZh = typeof fact.textZh === 'string' ? fact.textZh : '';
      if (!textEn && !textZh) return null;

      const id = typeof fact.id === 'string' && fact.id.trim()
        ? fact.id.trim()
        : `fact-${index}`;

      return { id, textEn, textZh };
    })
    .filter(Boolean);
}

/**
 * Create a stable client-side id for a plan slot.
 * @param {string} baseId
 * @returns {string}
 */
function makePlanItemId(baseId = '') {
  const safeBase = baseId && baseId.trim ? `-${baseId.trim()}` : '';
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}${safeBase}`;
}

/**
 * Normalize raw persisted plan entry into the new structured schema.
 * @param {*} raw
 * @returns {{uid:string,id:string,startTime:string,durationMinutes:number,participants:number,notes:string} | null}
 */
function normalizePlanItem(raw) {
  if (!raw || typeof raw !== 'object' || typeof raw.id !== 'string') {
    return null;
  }

  const tour = liveTours.find((t) => t.id === raw.id);
  const duration = Number.isFinite(Number(raw.durationMinutes))
    ? Math.max(15, Math.round(Number(raw.durationMinutes)))
    : Math.max(15, Math.round((tour?.duration || 0) * 60));

  const participants = Number.isInteger(Number(raw.participants))
    ? Math.max(MIN_PARTICIPANTS, Math.min(MAX_PARTICIPANTS, Number(raw.participants)))
    : DEFAULT_PARTICIPANTS;

  const startTime = (typeof raw.startTime === 'string' && raw.startTime.trim())
    ? raw.startTime.trim().slice(0, 5)
    : '';

  const notes = typeof raw.notes === 'string' ? raw.notes.trim().slice(0, 500) : '';

  return {
    uid: typeof raw.uid === 'string' && raw.uid.trim()
      ? raw.uid
      : makePlanItemId(raw.id),
    id: raw.id,
    startTime,
    durationMinutes: duration,
    participants,
    notes
  };
}

/**
 * Normalize any stored plan shape into the latest schema.
 * @param {*} rawPlan
 * @returns {Array<{uid:string,id:string,startTime:string,durationMinutes:number,participants:number,notes:string}>}
 */
function normalizePlan(rawPlan) {
  if (!Array.isArray(rawPlan)) return [];

  if (rawPlan.length === 0) return [];

  if (typeof rawPlan[0] === 'string') {
    return rawPlan
      .map((id) => normalizePlanItem({ id }))
      .filter(Boolean);
  }

  return rawPlan
    .map((entry) => normalizePlanItem(entry))
    .filter(Boolean);
}

/**
 * Create a plan item using tour defaults.
 * @param {string} tourId
 * @param {number} fallbackIndex
 * @returns {{uid:string,id:string,startTime:string,durationMinutes:number,participants:number,notes:string}}
 */
function makeDefaultPlanItem(tourId, fallbackIndex = 0) {
  const tour = liveTours.find((item) => item.id === tourId);
  const defaultDuration = Math.max(15, Math.round((tour?.duration || 1) * 60));
  const slot = PLAN_DEFAULT_TIME_SLOTS[state.lang]?.[fallbackIndex] || t('planTbd');

  return {
    uid: makePlanItemId(tourId),
    id: tourId,
    startTime: slot,
    durationMinutes: defaultDuration,
    participants: DEFAULT_PARTICIPANTS,
    notes: ''
  };
}

/**
 * Normalize a theme value from localStorage.
 * @param {string | null} rawTheme
 * @returns {string}
 */
function resolveTheme(rawTheme) {
  return THEME_VALUES.includes(rawTheme) ? rawTheme : THEME_FALLBACK;
}

/**
 * Safe JSON parse with fallback.
 * @param {string|null} raw
 * @param {*} fallback
 * @returns {*}
 */
function safeParse(raw, fallback) {
  if (!raw) return fallback;
  try { return JSON.parse(raw); }
  catch { return fallback; }
}

/** Application state */
const state = {
  lang: localStorage.getItem('pp_lang') || 'en',
  theme: resolveTheme(localStorage.getItem('pp_theme')),
  favs: safeParse(localStorage.getItem('pp_favs'), []),
  plan: normalizePlan(safeParse(localStorage.getItem(PLAN_STORAGE_KEY), [])),
  filter: 'All',
  searchQuery: ''
};

/** Cached DOM element references */
const els = {
  html: document.documentElement,
  toursGrid: document.getElementById('toursGrid'),
  planList: document.getElementById('planList'),
  statsPrice: document.getElementById('statsPrice'),
  statsDuration: document.getElementById('statsDuration'),
  tourModal: document.getElementById('tourModal'),
  bookingModal: document.getElementById('bookingModal'),
  chatPanel: document.getElementById('pandaChatPanel'),
  chatMessages: document.getElementById('chatMessages'),
  chatInput: document.getElementById('chatInput'),
  chatTriggerBtn: document.getElementById('chatTriggerBtn'),
  chatCloseBtn: document.getElementById('chatCloseBtn'),
  chatForm: document.getElementById('chatForm'),
  reviewsTrack: document.getElementById('reviewsTrack'),
  faqAccordion: document.getElementById('faqAccordion'),
  themeSelect: document.getElementById('themeSelect'),
  emptyPlan: document.getElementById('emptyPlanState'),
  filterButtons: document.querySelectorAll('.filter-btn'),
  searchInput: document.getElementById('tourSearch')
};

/** @type {'en' | 'zh'} */
const fallbackLanguage = 'en';
/** Chatbot copy configured in admin settings. */
let chatCopyOverrides = {};
/** Active brand logo URL configured in settings. */
let brandLogoSrc = 'logo.png';

/** Active drag payload cache for cross-browser drag compatibility. */
let activePlanDragPayload = null;

/**
 * Escape text for safe use in HTML attributes.
 * @param {*} text
 * @returns {string}
 */
function escapeAttr(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Resolve a logo URL from settings with a deterministic fallback.
 * @param {*} settings
 * @returns {string}
 */
function resolveBrandLogoUrl(settings) {
  const raw = settings && typeof settings.logoUrl === 'string' ? settings.logoUrl.trim() : '';
  return raw || 'logo.png';
}

/**
 * Apply logo URL to all branded image targets.
 * @param {string} url
 */
function applyBrandLogo(url) {
  brandLogoSrc = typeof url === 'string' && url.trim() ? url.trim() : 'logo.png';
  document.querySelectorAll('[data-brand-logo]').forEach((logoEl) => {
    logoEl.setAttribute('src', brandLogoSrc);
  });
}

/**
 * Resolve translation for current locale with deterministic fallback.
 * @param {string} key
 * @returns {string}
 */
function t(key) {
  if (chatCopyOverrides && chatCopyOverrides[key]) {
    const langKey = state.lang === 'en' ? 'en' : 'zh';
    const value = chatCopyOverrides[key][langKey];
    if (typeof value === 'string' && value.trim()) {
      const trimmed = value.trim();
      const enValue = typeof chatCopyOverrides[key].en === 'string' ? chatCopyOverrides[key].en.trim() : '';
      const zhDefault = appTranslations.zh?.[key];
      const enDefault = appTranslations.en?.[key];
      const hasDistinctDefaultByLang = typeof zhDefault === 'string' && typeof enDefault === 'string' && zhDefault !== enDefault;

      // Guard against legacy admin data where zh fields were accidentally saved as English copy.
      if (langKey === 'zh' && hasDistinctDefaultByLang && enValue && trimmed === enValue) {
        return zhDefault.replace('{year}', String(new Date().getFullYear()));
      }

      return trimmed.replace('{year}', String(new Date().getFullYear()));
    }
  }

  const translated = appTranslations[state.lang]?.[key] || appTranslations[fallbackLanguage][key] || key;
  if (typeof translated !== 'string') return key;
  return translated.replace('{year}', String(new Date().getFullYear()));
}

/**
 * Return true for placeholders that should be translated by data-i18n.
 * @param {HTMLElement} el
 * @returns {boolean}
 */
function isInputElement(el) {
  return el.tagName === 'TEXTAREA' || (el.tagName === 'INPUT' && !['button', 'submit', 'checkbox', 'radio', 'file'].includes(el.type));
}

/**
 * Apply translation to an element attribute via data-i18n-attr.
 * Supports syntax: "attr:translationKey;aria-label:translationKey".
 * @param {HTMLElement} el
 */
function applyTranslatedAttributes(el) {
  const spec = el.getAttribute('data-i18n-attr');
  if (!spec) return;

  spec.split(';').forEach((item) => {
    const [attribute, key] = item.split(':').map((part) => part && part.trim());
    if (!attribute || !key) return;
    el.setAttribute(attribute, t(key));
  });
}

/* ------------------------------------------------------------------ */
/*  i18n                                                               */
/* ------------------------------------------------------------------ */

/** Apply translations to all elements with data-i18n attribute. */
function applyTranslations() {
  if (els.html) els.html.setAttribute('lang', state.lang);

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const label = t(key);

    if (el.tagName === 'META' && el.hasAttribute('content')) {
      el.setAttribute('content', label);
    } else if (isInputElement(el)) {
      el.placeholder = label;
    } else {
      el.textContent = label;
    }
  });

  document.querySelectorAll('[data-i18n-attr]').forEach(applyTranslatedAttributes);
  document.querySelectorAll('[data-social-label]').forEach((socialEl) => {
    const key = socialEl.getAttribute('data-social-label');
    if (key) socialEl.setAttribute('aria-label', t(key));
  });

  renderThemeSelect();
  document.getElementById('langToggleText').textContent = state.lang === 'en' ? 'EN' : '中文';
}

/** Toggle between EN and ZH. */
function toggleLanguage() {
  state.lang = state.lang === 'en' ? 'zh' : 'en';
  localStorage.setItem('pp_lang', state.lang);
  applyTranslations();
  setFilter(state.filter);
  renderPlan();
  renderReviews();
  renderFaqs();
  refreshChatLanguage();
}

/* ------------------------------------------------------------------ */
/*  Theme                                                              */
/* ------------------------------------------------------------------ */

/** Apply the current theme to the document. */
function applyTheme() {
  els.html.setAttribute('data-theme', state.theme);
  if (els.themeSelect) {
    els.themeSelect.value = state.theme;
  }
}

/**
 * Set the active website theme.
 * @param {string} theme
 */
function setTheme(theme) {
  state.theme = resolveTheme(theme);
  localStorage.setItem('pp_theme', state.theme);
  applyTheme();
}

/** Render theme selector options with current language labels. */
function renderThemeSelect() {
  const themeSelect = els.themeSelect;
  if (!themeSelect) return;

  themeSelect.innerHTML = THEME_OPTIONS.map((theme) => `
    <option value="${theme.value}">${t(theme.labelKey)}</option>
  `).join('');
  themeSelect.value = state.theme;
}

/* ------------------------------------------------------------------ */
/*  Tours                                                              */
/* ------------------------------------------------------------------ */

/** Render the tour grid using liveTours from IndexedDB. */
function renderTours() {
  if (!els.toursGrid) return;

  const filteredTours = liveTours.filter(tour => {
    const matchTag = state.filter === 'All' || (tour.tags && tour.tags.includes(state.filter));
    const query = state.searchQuery.toLowerCase();
    const titleEn = (tour.titleEn || '').toLowerCase();
    const titleZh = tour.titleZh || '';
    const descEn = (tour.descEn || '').toLowerCase();
    const descZh = tour.descZh || '';
    const matchSearch = titleEn.includes(query) || titleZh.includes(query) || descEn.includes(query) || descZh.includes(query);
    return matchTag && matchSearch;
  });

  els.toursGrid.innerHTML = filteredTours.map((tour, idx) => {
    const isFavorite = state.favs.includes(tour.id);
    const title = state.lang === 'en' ? tour.titleEn : tour.titleZh;
    const desc = state.lang === 'en' ? tour.descEn : tour.descZh;
    const firstTag = tour.tags ? tour.tags[0] : '';
    const favoriteLabel = isFavorite ? t('tourUnfavorite') : t('tourFavorite');
    return `
    <div class="card bg-base-100 shadow-xl tour-card reveal delay-${idx % 3} cursor-grab" draggable="true" tabindex="0" aria-label="${t('addToDay')} — ${title}" data-tour-drag-source="catalog" data-tour-id="${tour.id}">
      <figure class="relative h-48">
        <img src="${tour.image}" alt="${title || 'Panda Professor Tour'}" class="w-full h-full object-cover" loading="lazy" />
        <div class="absolute top-2 right-2 flex gap-2">
          ${tour.popular ? `<div class="badge badge-warning gap-1">⭐ ${t('tourPopular')}</div>` : ''}
          ${firstTag ? `<div class="badge badge-neutral shadow-sm">${firstTag}</div>` : ''}
        </div>
        <button class="btn btn-circle btn-sm absolute bottom-2 right-2 glass heart-btn ${isFavorite ? 'is-favorite' : ''}" data-tour-action="toggle-fav" data-tour-id="${tour.id}" type="button" aria-label="${favoriteLabel}">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
        </button>
      </figure>
      <div class="card-body p-5">
        <h3 class="card-title text-lg leading-tight line-clamp-2">${title}</h3>
        <p class="text-sm text-base-content/70 line-clamp-2 flex-grow">${desc}</p>
        <div class="divider my-1 opacity-50"></div>
        <div class="flex justify-between items-center w-full">
          <div>
            <div class="text-xs opacity-70 mb-0.5">${t('tourPriceTime')}</div>
            <div class="font-bold">¥${tour.price} <span class="font-normal text-xs opacity-70">/ ${tour.duration}h</span></div>
          </div>
          <div class="card-actions">
            <button class="btn btn-primary btn-sm" data-tour-action="open-tour" data-tour-id="${tour.id}" type="button" aria-label="${t('tourView')}">${t('tourView')}</button>
            <button class="btn btn-outline btn-sm" data-tour-action="add-to-plan" data-tour-id="${tour.id}" aria-label="${t('addToDay')}" type="button">
              +
            </button>
          </div>
        </div>
      </div>
    </div>
    `;
  }).join('');

  initReveal();
}

let toursRenderFrame = null;

/**
 * Debounced requestAnimationFrame render for tour list.
 */
function requestToursRender() {
  if (toursRenderFrame) return;
  toursRenderFrame = requestAnimationFrame(() => {
    toursRenderFrame = null;
    renderTours();
  });
}

/** Internal queue for debounced search updates. */
let searchUpdateFrame = null;
let pendingSearchQuery = '';

/**
 * Set the active filter tag.
 * @param {string} filter
 */
function setFilter(filter) {
  state.filter = filter;
  els.filterButtons.forEach(b => {
    if (b.dataset.filter === filter) {
      b.classList.remove('btn-outline');
      b.setAttribute('aria-pressed', 'true');
    } else {
      b.classList.add('btn-outline');
      b.setAttribute('aria-pressed', 'false');
    }
  });
  requestToursRender();
}

/**
 * Handle tour search input.
 * @param {Event} e
 */
function handleSearch(e) {
  const nextValue = e && e.target && typeof e.target.value === 'string'
    ? e.target.value
    : '';
  pendingSearchQuery = nextValue;

  if (searchUpdateFrame) {
    cancelAnimationFrame(searchUpdateFrame);
  }

  searchUpdateFrame = requestAnimationFrame(() => {
    state.searchQuery = pendingSearchQuery;
    searchUpdateFrame = null;
    requestToursRender();
  });
}

/**
 * Toggle a tour as favorite.
 * @param {string} id
 */
function toggleFav(id) {
  if (state.favs.includes(id)) {
    state.favs = state.favs.filter(f => f !== id);
  } else {
    state.favs.push(id);
  }
  localStorage.setItem('pp_favs', JSON.stringify(state.favs));
  requestToursRender();
}

/**
 * Open the tour detail modal.
 * @param {string} id
 */
function openTourModal(id) {
  const tour = liveTours.find(tourData => tourData.id === id);
  if (!tour || !els.tourModal) return;

  const content = els.tourModal.querySelector('.modal-box');
  const title = state.lang === 'en' ? tour.titleEn : tour.titleZh;
  const desc = state.lang === 'en' ? tour.descEn : tour.descZh;
  const inc = state.lang === 'en' ? (tour.inclusionsEn || []) : (tour.inclusionsZh || []);
  const exc = state.lang === 'en' ? (tour.exclusionsEn || []) : (tour.exclusionsZh || []);

  content.innerHTML = `
    <form method="dialog">
      <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
    </form>
    <img src="${tour.image}" alt="${title}" class="w-full h-48 object-cover rounded-t-xl -mt-6 -mx-6 mb-4" style="width: calc(100% + 3rem); max-width: none;" />
    <h3 class="font-bold text-xl mb-2">${title}</h3>
    <p class="py-2 text-base-content/80">${desc}</p>
    
    <div class="grid grid-cols-2 gap-4 my-4">
      <div class="bg-base-200 p-3 rounded-box">
        <div class="text-xs opacity-70 uppercase font-bold tracking-wider mb-1">${t('tourDuration')}</div>
        <div class="font-bold text-lg">${tour.duration} ${t('tourHours')}</div>
      </div>
      <div class="bg-base-200 p-3 rounded-box">
        <div class="text-xs opacity-70 uppercase font-bold tracking-wider mb-1">${t('tourBasePrice')}</div>
        <div class="font-bold text-lg">¥${tour.price} CNY</div>
      </div>
    </div>
    
    <div class="my-4">
      <h4 class="font-bold mb-2 flex items-center gap-2">
        <span class="text-success">✓</span> ${t('tourInclusions')}
      </h4>
      <ul class="text-sm space-y-1 pl-6 list-disc opacity-80">
        ${inc.map(i => `<li>${i}</li>`).join('')}
      </ul>
    </div>
    
    <div class="my-4">
      <h4 class="font-bold mb-2 flex items-center gap-2">
        <span class="text-error">✕</span> ${t('tourExclusions')}
      </h4>
      <ul class="text-sm space-y-1 pl-6 list-disc opacity-80">
        ${exc.map(i => `<li>${i}</li>`).join('')}
      </ul>
    </div>
    
    <div class="modal-action mt-6">
      <button class="btn btn-primary w-full shadow-lg" type="button" data-tour-action="add-plan-and-close" data-tour-id="${tour.id}">
        ${t('addToDay')} (¥${tour.price})
      </button>
    </div>
  `;

  els.tourModal.showModal();
}

/* ------------------------------------------------------------------ */
/*  Plan / Day Builder                                                 */
/* ------------------------------------------------------------------ */

/**
 * Add a tour to the day plan.
 * @param {string} id
 */
function addToPlan(id) {
  addToPlanAt(id, state.plan.length);
}

/**
 * Add a tour to plan at a specific position.
 * @param {string} id
 * @param {number|null} insertAt
 */
function addToPlanAt(id, insertAt = null) {
  const tour = liveTours.find((item) => item.id === id);
  if (!tour) return;

  const index = Number.isInteger(insertAt) ? insertAt : state.plan.length;
  const clampedIndex = Math.max(0, Math.min(index, state.plan.length));
  state.plan.splice(clampedIndex, 0, makeDefaultPlanItem(id, clampedIndex));
  persistPlan();
  renderTours();
  renderPlan();
}

/**
 * Move one planned item to another index.
 * @param {number} fromIndex
 * @param {number} toIndex
 */
function movePlanItem(fromIndex, toIndex) {
  if (!Number.isInteger(fromIndex) || !Number.isInteger(toIndex)) return;
  if (fromIndex === toIndex || fromIndex < 0 || fromIndex >= state.plan.length) return;

  const normalizedToIndex = Math.max(0, Math.min(toIndex, state.plan.length));
  if (fromIndex === normalizedToIndex || fromIndex === normalizedToIndex - 1) return;

  const item = state.plan.splice(fromIndex, 1)[0];
  const insertionIndex = fromIndex < normalizedToIndex
    ? normalizedToIndex - 1
    : normalizedToIndex;

  if (insertionIndex < 0) {
    state.plan.unshift(item);
  } else {
    state.plan.splice(insertionIndex, 0, item);
  }

  persistPlan();
  renderTours();
  renderPlan();
}

/**
 * Remove a tour from the day plan.
 * @param {string|number} id
 */
function removeFromPlan(id) {
  const index = Number.parseInt(id, 10);
  if (Number.isInteger(index) && index >= 0 && index < state.plan.length) {
    state.plan = state.plan.filter((_, planIndex) => planIndex !== index);
  } else {
    state.plan = state.plan.filter((p) => p.id !== id);
  }

  persistPlan();
  renderTours();
  renderPlan();
}

/** Clear all tours from the day plan. */
function clearPlan() {
  state.plan = [];
  persistPlan();
  renderTours();
  renderPlan();
}

/**
 * Update a plan customization property for one item.
 * @param {number} index
 * @param {'startTime'|'durationMinutes'|'participants'|'notes'} key
 * @param {string} value
 */
function updatePlanItem(index, key, value) {
  const item = state.plan[index];
  if (!item) return;

  if (key === 'startTime') {
    item.startTime = typeof value === 'string' ? value : '';
  }

  if (key === 'durationMinutes') {
    const duration = Number(value);
    if (Number.isFinite(duration) && duration > 0) {
      item.durationMinutes = Math.max(30, Math.round(duration * 60));
    }
  }

  if (key === 'participants') {
    const count = parseInt(value, 10);
    if (Number.isInteger(count) && count >= MIN_PARTICIPANTS) {
      item.participants = Math.min(MAX_PARTICIPANTS, Math.max(MIN_PARTICIPANTS, count));
    }
  }

  if (key === 'notes') {
    item.notes = typeof value === 'string' ? value.trim().slice(0, 500) : '';
  }

  persistPlan();
  renderTours();
  renderPlan();
}

/**
 * Persist plan state in localStorage and URL.
 */
function persistPlan() {
  localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(state.plan));
  updateUrlHash();
}

/**
 * Compute a display-friendly duration string from minutes.
 * @param {number} minutes
 * @returns {string}
 */
function formatDuration(minutes) {
  if (!Number.isFinite(minutes) || minutes <= 0) return '0';
  return Number.isInteger(minutes / 60)
    ? `${minutes / 60}`
    : `${Number((minutes / 60).toFixed(1))}`;
}

/**
 * Find drop target index for a plan item.
 * @param {HTMLElement} planContainer
 * @param {MouseEvent|DragEvent} event
 * @returns {number}
 */
function getPlanDropIndex(planContainer, event) {
  const items = [...planContainer.querySelectorAll('[data-plan-index]')];
  if (!items.length) return 0;

  const target = event.target.closest('[data-plan-index]');
  if (!target) return items.length;

  const targetIndex = parseInt(target.dataset.planIndex, 10);
  if (!Number.isInteger(targetIndex)) return items.length;

  const rect = target.getBoundingClientRect();
  const midpoint = rect.top + rect.height / 2;
  return event.clientY > midpoint ? targetIndex + 1 : targetIndex;
}

/**
 * Parse plan drag payload from drag events.
 * @param {DragEvent} event
 * @returns {{source:'catalog'|'plan', id?:string, index?:number}|null}
 */
function readPlanDragPayload(event) {
  if (!event.dataTransfer) return null;

  try {
    const raw = event.dataTransfer.getData('application/json')
      || event.dataTransfer.getData('text/plain')
      || event.dataTransfer.getData('text');
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

/**
 * Resolve active drag payload from transfer data or cached payload.
 * @param {DragEvent} event
 * @returns {{source:'catalog'|'plan', id?:string, index?:number}|null}
 */
function resolvePlanDragPayload(event) {
  if (activePlanDragPayload) return activePlanDragPayload;
  return readPlanDragPayload(event);
}

/** Render the day plan list with editable customizations. */
function renderPlan() {
  if (!els.planList) return;

  const planItems = state.plan
    .map((item, index) => ({
      index,
      item,
      tour: liveTours.find((tour) => tour.id === item.id)
    }))
    .filter((entry) => !!entry.tour);

  if (planItems.length === 0) {
    els.planList.innerHTML = `<div class="p-8 text-center opacity-60 bg-base-200 rounded-box border border-dashed border-base-content/20">${t('dayBuilderEmpty')}</div>`;
    els.statsPrice.textContent = '¥0';
    els.statsDuration.textContent = '0h';
    return;
  }

  let totalPrice = 0;
  let totalDuration = 0;

  els.planList.innerHTML = planItems.map(({ item, tour, index }) => {
    const baseMinutes = Number.isFinite(Number(item.durationMinutes))
      ? Number(item.durationMinutes)
      : Math.max(15, Math.round((tour.duration || 1) * 60));

    const participants = Number.isInteger(item.participants)
      ? item.participants
      : DEFAULT_PARTICIPANTS;

    const startTime = typeof item.startTime === 'string' ? item.startTime : '';
    const notes = typeof item.notes === 'string' ? item.notes : '';
    const durationHours = formatDuration(baseMinutes);
    item.durationMinutes = baseMinutes;

    totalPrice += Number(tour.price || 0) * participants;
    totalDuration += baseMinutes;

    return `
      <div class="plan-item flex gap-3 items-start p-3 bg-base-100 rounded-box border border-base-200 shadow-sm animate-fade-in-up cursor-grab" data-plan-index="${index}" draggable="true">
        <div class="w-16 h-16 rounded-lg overflow-hidden shrink-0">
          <img src="${tour.image}" class="w-full h-full object-cover" />
        </div>
        <div class="flex-grow min-w-0 space-y-2">
          <h4 class="font-bold text-sm truncate">${state.lang === 'en' ? tour.titleEn : tour.titleZh}</h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <label class="fieldset-label" aria-label="${t('planItemTime')}">
              <span class="opacity-70">${t('planItemTime')}</span>
              <input class="input input-bordered input-xs w-full mt-1" type="time" data-plan-action="startTime" data-plan-index="${index}" value="${startTime}" />
            </label>
            <label class="fieldset-label" aria-label="${t('planItemDuration')}">
              <span class="opacity-70">${t('planItemDuration')}</span>
              <div class="flex items-center gap-2 mt-1">
                <input class="input input-bordered input-xs w-full" type="number" min="0.5" max="24" step="0.5" data-plan-action="durationMinutes" data-plan-index="${index}" value="${durationHours}" />
                <span class="text-xs opacity-70 shrink-0">${t('planItemHours')}</span>
              </div>
            </label>
            <label class="fieldset-label" aria-label="${t('planItemPeople')}">
              <span class="opacity-70">${t('planItemPeople')}</span>
              <input class="input input-bordered input-xs w-full mt-1" type="number" min="${MIN_PARTICIPANTS}" max="${MAX_PARTICIPANTS}" step="1" data-plan-action="participants" data-plan-index="${index}" value="${participants}" />
            </label>
            <div class="text-xs opacity-70 flex items-end">¥${tour.price} × ${participants}</div>
          </div>
          <textarea class="textarea textarea-sm textarea-bordered w-full mt-1" rows="2" data-plan-action="notes" data-plan-index="${index}" placeholder="${t('planItemNotesPlaceholder')}">${notes}</textarea>
        </div>
        <button class="btn btn-ghost btn-circle btn-sm text-error shrink-0" type="button" data-tour-action="remove-from-plan" data-plan-index="${index}" aria-label="${t('removeFromDay')}">✕</button>
      </div>
    `;
  }).join('');

  els.statsPrice.textContent = `¥${Math.round(totalPrice)}`;
  els.statsDuration.textContent = `${formatDuration(totalDuration)}h`;
}

/* ------------------------------------------------------------------ */
/*  Sharing                                                            */
/* ------------------------------------------------------------------ */

/** Encode plan state into URL hash. */
function updateUrlHash() {
  if (state.plan.length > 0) {
    const data = btoa(JSON.stringify(state.plan));
    window.location.hash = `plan=${data}`;
  } else {
    window.location.hash = '';
  }
}

/** Load plan from URL hash if present. */
function loadFromHash() {
  if (window.location.hash.startsWith('#plan=')) {
    const parsed = safeParse(atob(window.location.hash.replace('#plan=', '')), null);
    if (Array.isArray(parsed)) {
      state.plan = normalizePlan(parsed);
      localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(state.plan));
    }
  }
}

/** Copy the current plan link to clipboard. */
function sharePlan() {
  updateUrlHash();
  navigator.clipboard.writeText(window.location.href).then(() => {
    const btn = document.getElementById('shareBtn');
    if (!btn) return;
    btn.innerHTML = `✓ ${t('copied')}`;
    btn.classList.add('btn-success');
    setTimeout(() => {
      btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" x2="12" y1="2" y2="15"/></svg> ${t('sharePlan')}`;
      btn.classList.remove('btn-success');
    }, 2000);
  });
}

/* ------------------------------------------------------------------ */
/*  Content Renderers                                                  */
/* ------------------------------------------------------------------ */

/** Render the rating stars for a review. */
function renderReviewStars(rating = 5) {
  const max = 5;
  const safeRating = Number.isInteger(rating) ? Math.min(Math.max(rating, 1), max) : max;
  return Array.from({ length: max }, (_, index) => index < safeRating).map((filled) => `
    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ${filled ? 'text-warning fill-current' : 'text-base-content/20'}" viewBox="0 0 20 20" aria-hidden="true">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
    </svg>
  `).join('');
}

/** Build review avatar markup. */
function renderReviewAvatar(review) {
  const avatar = (typeof review?.avatar === 'string' && review.avatar.trim()) ? review.avatar.trim() : '';
  const initial = review?.name ? review.name.charAt(0).toUpperCase() : '?';
  const alt = `${review?.name || 'Guest'} avatar`;
  
  if (!avatar) {
    return `<div class="bg-neutral text-neutral-content rounded-full w-10 h-10 flex items-center justify-center" aria-hidden="true"><span class="text-xs">${initial}</span></div>`;
  }

  return `<img src="${avatar}" alt="${alt}" class="w-10 h-10 rounded-full object-cover" loading="lazy" />`;
}

/** Render the reviews carousel. */
function renderReviews() {
  if (!els.reviewsTrack) return;
  els.reviewsTrack.innerHTML = liveReviews.map((r) => `
    <div class="carousel-item w-full sm:w-1/2 md:w-1/3 p-4">
      <div class="card bg-base-100 shadow-xl border border-base-200 w-full h-full">
        <div class="card-body">
          <div class="flex gap-1 mb-2" aria-label="${r.rating || 5} star rating">
            ${renderReviewStars(r.rating)}
          </div>
          <p class="italic">"${state.lang === 'en' ? r.textEn : r.textZh}"</p>
          <div class="flex items-center gap-3 mt-4 mt-auto">
            <div class="avatar">
              ${renderReviewAvatar(r)}
            </div>
            <div>
              <div class="font-bold text-sm">${r.name}</div>
              <div class="text-xs opacity-60">${r.country}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

/** Render the FAQ accordion. */
function renderFaqs() {
  if (!els.faqAccordion) return;
  els.faqAccordion.innerHTML = liveFaqs.map((f, i) => `
    <div class="collapse collapse-arrow bg-base-100 border border-base-200 shadow-sm faq-collapse">
      <input type="checkbox" />
      <div class="collapse-title faq-question text-base lg:text-lg font-medium leading-snug">${state.lang === 'en' ? f.qEn : f.qZh}</div>
      <div class="collapse-content faq-answer text-sm lg:text-base text-base-content/80">
        <p>${state.lang === 'en' ? f.aEn : f.aZh}</p>
      </div>
    </div>
  `).join('');
}

/* ------------------------------------------------------------------ */
/*  Panda Chat Widget                                                  */
/* ------------------------------------------------------------------ */

let chatOpen = false;
let chatCloseTimer = null;

/**
 * Open the Panda Chat panel.
 * @param {boolean} focusInput
 */
function openChatPanel(focusInput = true) {
  const chatPanel = els.chatPanel;
  const chatMessages = document.getElementById('chatMessages');
  const chatTrigger = document.getElementById('chatTriggerBtn');
  if (!chatPanel) return;

  if (chatCloseTimer) {
    clearTimeout(chatCloseTimer);
    chatCloseTimer = null;
  }

  chatOpen = true;
  chatPanel.classList.remove('hidden', 'chat-closing');
  chatPanel.classList.add('flex', 'chat-opening');
  chatPanel.hidden = false;
  chatPanel.style.display = '';
  chatPanel.setAttribute('aria-hidden', 'false');
  if (chatTrigger) chatTrigger.setAttribute('aria-expanded', 'true');

  if (chatMessages && chatMessages.children.length === 0) {
    appendMessage('panda', t('chatWelcome'), 'chatWelcome');
    showQuickReplies();
  }

  if (focusInput && els.chatInput) {
    els.chatInput.focus({ preventScroll: true });
  }
}

/** Close the Panda Chat panel with animation. */
function closeChatPanel() {
  const chatPanel = els.chatPanel;
  const chatTrigger = document.getElementById('chatTriggerBtn');
  if (!chatPanel) return;

  if (chatCloseTimer) {
    clearTimeout(chatCloseTimer);
    chatCloseTimer = null;
  }

  chatOpen = false;
  chatPanel.classList.remove('chat-opening');
  chatPanel.classList.add('chat-closing');
  if (chatTrigger) chatTrigger.setAttribute('aria-expanded', 'false');

  chatCloseTimer = setTimeout(() => {
    if (chatOpen) return;
    chatPanel.hidden = true;
    chatPanel.style.display = 'none';
    chatPanel.classList.add('hidden');
    chatPanel.classList.remove('flex', 'chat-closing');
    chatPanel.setAttribute('aria-hidden', 'true');
    chatCloseTimer = null;
  }, 250);
}

/** Refresh chat UI text where needed after locale changes. */
function refreshChatLanguage() {
  const chatMessages = document.getElementById('chatMessages');
  if (!chatMessages) return;

  const hadQuickReplies = !!chatMessages.querySelector('.fade-in-qs');
  clearQuickReplies();
  chatMessages.querySelectorAll('[data-chat-i18n-key]').forEach((node) => {
    const key = node.getAttribute('data-chat-i18n-key');
    if (!key) return;
    node.textContent = t(key);
  });
  chatMessages.querySelectorAll('[data-chat-fact-id]').forEach((node) => {
    const factId = node.getAttribute('data-chat-fact-id');
    if (!factId) return;
    const fact = liveFacts.find((item) => item.id === factId);
    if (!fact) return;
    node.textContent = state.lang === 'en' ? fact.textEn : fact.textZh;
  });

  if (hadQuickReplies) {
    showQuickReplies();
  }
}

/** Toggle the Panda Chat panel visibility. */
function toggleChat() {
  if (!els.chatPanel) return;
  if (chatOpen) {
    closeChatPanel();
  } else {
    openChatPanel(true);
  }
}

/**
 * Append a chat message bubble.
 * @param {'panda'|'user'} sender
 * @param {string} text
 * @param {string} i18nKey
 * @param {string} factId
 */
function appendMessage(sender, text, i18nKey = '', factId = '') {
  const chatMessages = document.getElementById('chatMessages');
  const safeText = typeof text === 'string' ? text : '';
  if (!chatMessages || !safeText) return;
  const div = document.createElement('div');
  div.className = `chat ${sender === 'user' ? 'chat-end' : 'chat-start'} animate-fade-in-up`;

  let avatar = '';
  if (sender === 'panda') {
    avatar = `<div class="chat-image avatar"><div class="w-10 rounded-full border border-base-300 p-1 bg-white shadow-sm"><img src="${escapeAttr(brandLogoSrc)}" alt="Panda" /></div></div>`;
  }

  const bubbleClass = sender === 'user' ? 'chat-bubble-primary' : 'chat-bubble bg-base-200 text-base-content';

  if (avatar) {
    const avatarWrap = document.createElement('div');
    avatarWrap.innerHTML = avatar;
    div.appendChild(avatarWrap.firstElementChild);
  }

  const bubble = document.createElement('div');
  bubble.className = `chat-bubble ${bubbleClass} text-sm shadow-sm`;
  if (i18nKey) {
    bubble.dataset.chatI18nKey = i18nKey;
  }
  if (factId) {
    bubble.dataset.chatFactId = factId;
  }
  bubble.textContent = safeText;
  div.appendChild(bubble);

  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

/** Show the typing indicator. */
function showTyping() {
  const chatMessages = document.getElementById('chatMessages');
  if (!chatMessages) return;
  const div = document.createElement('div');
  div.id = 'typingIndicator';
  div.className = 'chat chat-start animate-fade-in-up';
  div.innerHTML = `
    <div class="chat-image avatar"><div class="w-10 rounded-full border border-base-300 p-1 bg-white shadow-sm"><img src="${escapeAttr(brandLogoSrc)}" alt="Panda" /></div></div>
    <div class="chat-bubble bg-base-200 text-base-content typing-indicator px-4"><span class="bg-base-content"></span><span class="bg-base-content"></span><span class="bg-base-content"></span></div>
  `;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

/** Hide the typing indicator. */
function hideTyping() {
  const chatMessages = document.getElementById('chatMessages');
  const ind = document.getElementById('typingIndicator');
  if (ind) ind.remove();
}

/** Show quick reply buttons in the chat. */
function showQuickReplies() {
  const chatMessages = document.getElementById('chatMessages');
  if (!chatMessages) return;
  const qrDiv = document.createElement('div');
  qrDiv.className = 'flex flex-col gap-2 p-2 pt-4 items-end animate-fade-in-up-delay-1 fade-in-qs';
  qrDiv.innerHTML = `
    <button type="button" class="btn btn-sm btn-outline rounded-full quick-reply shadow-sm bg-base-100" data-quick-reply="tours" data-chat-i18n-key="chatBtnTours">${t('chatBtnTours')}</button>
    <button type="button" class="btn btn-sm btn-outline rounded-full quick-reply shadow-sm bg-base-100" data-quick-reply="food" data-chat-i18n-key="chatBtnFood">${t('chatBtnFood')}</button>
    <button type="button" class="btn btn-sm btn-outline rounded-full quick-reply shadow-sm bg-base-100" data-quick-reply="panda" data-chat-i18n-key="chatBtnPanda">${t('chatBtnPanda')}</button>
  `;
  chatMessages.appendChild(qrDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

/** Safely close mobile drawer if enabled. */
function closeMobileDrawer() {
  const drawerToggle = document.getElementById('mobile-drawer');
  if (drawerToggle && drawerToggle.checked) {
    drawerToggle.checked = false;
  }
}

/**
 * Update plan customization values from controls.
 * @param {Event} event
 */
function handlePlanInputChange(event) {
  const source = event.target.closest('[data-plan-action]');
  if (!source || !els.planList || event.target.closest('button')) return;

  if (event.type === 'input' && source.dataset.planAction === 'notes') {
    return;
  }

  const index = parseInt(source.dataset.planIndex, 10);
  if (!Number.isInteger(index)) return;

  const action = source.dataset.planAction;
  if (action === 'startTime') {
    updatePlanItem(index, 'startTime', source.value);
    return;
  }

  if (action === 'durationMinutes') {
    updatePlanItem(index, 'durationMinutes', source.value);
    return;
  }

  if (action === 'participants') {
    updatePlanItem(index, 'participants', source.value);
    return;
  }

  if (action === 'notes') {
    updatePlanItem(index, 'notes', source.value);
  }
}

/**
 * Enable drag-to-add and drag-to-reorder plan interactions.
 * @param {DragEvent} event
 */
function handleDragStart(event) {
  const catalogCard = event.target.closest('[data-tour-drag-source="catalog"][data-tour-id]');
  const planItem = event.target.closest('[data-plan-index][draggable="true"]');
  if (!catalogCard && !planItem) return;

  if (event.target.closest('button, input, textarea, select')) return;

  const payload = catalogCard
    ? { source: 'catalog', id: catalogCard.dataset.tourId }
    : { source: 'plan', index: Number.parseInt(planItem.dataset.planIndex, 10) };

  if (catalogCard && !payload.id) return;
  if (!catalogCard && !planItem) return;

  const serializedPayload = JSON.stringify(payload);
  event.dataTransfer.setData('application/json', serializedPayload);
  event.dataTransfer.setData('text/plain', serializedPayload);
  event.dataTransfer.setData('text', serializedPayload);
  event.dataTransfer.effectAllowed = 'move';
  activePlanDragPayload = payload;
}

/**
 * Handle drag over for droppable plan container.
 * @param {DragEvent} event
 */
function handlePlanDragOver(event) {
  const payload = resolvePlanDragPayload(event);
  if (!payload) return;
  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
}

/**
 * Handle dropping into the plan container.
 * @param {DragEvent} event
 */
function handlePlanDrop(event) {
  const payload = resolvePlanDragPayload(event);
  if (!payload || !els.planList) return;

  event.preventDefault();

  const toIndex = getPlanDropIndex(els.planList, event);
  if (payload.source === 'catalog') {
    addToPlanAt(payload.id, toIndex);
    activePlanDragPayload = null;
    return;
  }

  if (payload.source === 'plan' && Number.isInteger(payload.index)) {
    movePlanItem(payload.index, toIndex);
  }

  activePlanDragPayload = null;
}

/** Clear cached drag payload when drag ends. */
function clearActiveDragPayload() {
  activePlanDragPayload = null;
}

/**
 * Handle delegated action buttons rendered by templates.
 * @param {'toggle-fav'|'open-tour'|'add-to-plan'|'remove-from-plan'|'add-plan-and-close'} action
 * @param {string} id
 */
function handleTourAction(action, id) {
  const tourId = typeof id === 'string' ? id.trim() : '';
  if (!tourId && action !== 'close-drawer') return;
  const index = Number.parseInt(tourId, 10);

  switch (action) {
    case 'toggle-fav':
      toggleFav(tourId);
      break;
    case 'open-tour':
      openTourModal(tourId);
      break;
    case 'add-to-plan':
      addToPlan(tourId);
      break;
    case 'remove-from-plan':
      if (Number.isInteger(index)) {
        removeFromPlan(index);
      } else {
        removeFromPlan(tourId);
      }
      break;
    case 'add-plan-and-close':
      addToPlan(tourId);
      if (els.tourModal) els.tourModal.close();
      break;
    default:
      break;
  }
}

/** Bind declarative and static page actions. */
function bindAppEvents() {
  const langToggle = document.getElementById('langToggleText');
  if (langToggle) {
    langToggle.addEventListener('click', toggleLanguage);
  }

  if (els.themeSelect) {
    els.themeSelect.addEventListener('change', (event) => {
      setTheme(event.target.value);
    });
  }

  const bookPlanBtn = document.getElementById('bookPlanBtn');
  if (bookPlanBtn && els.bookingModal) {
    bookPlanBtn.addEventListener('click', () => {
      els.bookingModal.showModal();
    });
  }

  const shareBtn = document.getElementById('shareBtn');
  if (shareBtn) {
    shareBtn.addEventListener('click', sharePlan);
  }

  const clearPlanBtn = document.getElementById('clearPlanBtn');
  if (clearPlanBtn) {
    clearPlanBtn.addEventListener('click', clearPlan);
  }

  const bookingForm = document.getElementById('bookingForm');
  if (bookingForm) {
    bookingForm.addEventListener('submit', submitBooking);
  }

  const bookingModalCancelBtn = document.getElementById('bookingModalCancelBtn');
  if (bookingModalCancelBtn && els.bookingModal) {
    bookingModalCancelBtn.addEventListener('click', () => {
      els.bookingModal.close();
    });
  }

  document.addEventListener('click', (event) => {
    const actionButton = event.target.closest('[data-action]');
    if (actionButton) {
      if (actionButton.dataset.action === 'close-drawer') {
        closeMobileDrawer();
        return;
      }
      if (actionButton.dataset.action === 'set-filter') {
        const filter = actionButton.dataset.filter;
        if (filter) setFilter(filter);
        return;
      }
    }

    const tourActionButton = event.target.closest('[data-tour-action]');
    if (tourActionButton) {
      handleTourAction(
        tourActionButton.dataset.tourAction,
        tourActionButton.dataset.tourId || tourActionButton.dataset.planIndex || ''
      );
      return;
    }

    const tourCard = event.target.closest('.tour-card[data-tour-id]');
    if (tourCard && !event.target.closest('button, a, input, textarea, select, label')) {
      addToPlan(tourCard.dataset.tourId);
    }
  });

  document.addEventListener('keydown', (event) => {
    const tourCard = event.target.closest('.tour-card[data-tour-id]');
    if (!tourCard) return;
    if (event.target.closest('button, a, input, textarea, select, label')) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    addToPlan(tourCard.dataset.tourId);
  });

  if (els.planList) {
    els.planList.addEventListener('change', handlePlanInputChange);
    els.planList.addEventListener('input', handlePlanInputChange);
    els.planList.addEventListener('dragstart', handleDragStart);
    els.planList.addEventListener('dragover', handlePlanDragOver);
    els.planList.addEventListener('drop', handlePlanDrop);
  }

  document.addEventListener('dragstart', (event) => {
    const toursGrid = document.getElementById('toursGrid');
    if (!toursGrid || !toursGrid.contains(event.target)) return;
    handleDragStart(event);
  });
  document.addEventListener('dragend', clearActiveDragPayload);
}

/** Bind chat events without inline HTML handlers. */
function bindChatEvents() {
  if (els.chatTriggerBtn) {
    els.chatTriggerBtn.addEventListener('click', toggleChat);
  }
  if (els.chatCloseBtn) {
    els.chatCloseBtn.addEventListener('click', toggleChat);
  }
  if (els.chatForm) {
    els.chatForm.addEventListener('submit', handleChatSubmit);
  }

  if (els.chatPanel) {
    els.chatPanel.addEventListener('click', (event) => {
      const quickReply = event.target.closest('[data-quick-reply]');
      if (!quickReply) return;
      const type = quickReply.dataset.quickReply;
      if (type && ['tours', 'food', 'panda'].includes(type)) {
        handleQuickReply(type);
      }
    });
  }
}

/** Remove quick reply buttons. */
function clearQuickReplies() {
  document.querySelectorAll('.fade-in-qs').forEach(el => el.remove());
}

/**
 * Handle a quick reply button click.
 * @param {'tours'|'food'|'panda'} type
 */
function handleQuickReply(type) {
  clearQuickReplies();

  const map = {
    tours: { user: 'chatBtnTours', panda: 'chatResTours' },
    food:  { user: 'chatBtnFood',  panda: 'chatResFood' }
  };

  if (type === 'panda') {
    appendMessage('user', t('chatBtnPanda'), 'chatBtnPanda');
    showTyping();
    setTimeout(() => {
      hideTyping();
      // Select random fact from liveFacts
      if (liveFacts.length > 0) {
        const randomFact = liveFacts[Math.floor(Math.random() * liveFacts.length)];
        const factText = state.lang === 'en' ? randomFact.textEn : randomFact.textZh;
        if (randomFact.id && factText) {
          appendMessage('panda', factText, '', randomFact.id);
        } else {
          appendMessage('panda', t('chatResPanda'), 'chatResPanda'); // fallback if empty
        }
      } else {
        appendMessage('panda', t('chatResPanda'), 'chatResPanda'); // fallback if empty
      }
      setTimeout(showQuickReplies, 1500);
    }, 1200);
    return;
  }

  const entry = map[type];
  if (!entry) return;

  appendMessage('user', t(entry.user), entry.user);
  showTyping();

  setTimeout(() => {
    hideTyping();
    appendMessage('panda', t(entry.panda), entry.panda);
    setTimeout(showQuickReplies, 1500);
  }, 1200);
}

/**
 * Handle chat form submission.
 * @param {Event} e
 */
function handleChatSubmit(e) {
  if (e) e.preventDefault();
  if (!els.chatInput) return;
  const text = els.chatInput.value.trim();
  if (!text) return;

  clearQuickReplies();
  appendMessage('user', text);
  els.chatInput.value = '';

  showTyping();
  setTimeout(() => {
    hideTyping();
    
    // Check if the user is asking about pandas, and return a fact!
    const textLower = text.toLowerCase();
    if (textLower.includes('panda') || textLower.includes('熊猫') || textLower.includes('大熊猫') || textLower.includes('fact')) {
      if (liveFacts.length > 0) {
        const randomFact = liveFacts[Math.floor(Math.random() * liveFacts.length)];
        const factText = state.lang === 'en' ? randomFact.textEn : randomFact.textZh;
        if (randomFact.id && factText) {
          appendMessage('panda', factText, '', randomFact.id);
        } else {
          appendMessage('panda', t('chatResPanda'), 'chatResPanda');
        }
      } else {
        appendMessage('panda', t('chatResPanda'), 'chatResPanda');
      }
    } else {
      appendMessage('panda', t('chatDefaultResponse'), 'chatDefaultResponse');
    }
    setTimeout(showQuickReplies, 1000);
  }, 1500);
}

/* ------------------------------------------------------------------ */
/*  Booking Flow (writes to PandaDB)                                   */
/* ------------------------------------------------------------------ */

/**
 * Submit a booking request.
 * @param {Event} e
 */
async function submitBooking(e) {
  e.preventDefault();

  const name = document.getElementById('bName').value;
  const email = document.getElementById('bEmail').value;
  const date = document.getElementById('bDate').value;
  const guests = document.getElementById('bGuests').value;
  const notes = document.getElementById('bNotes').value;

  const planDetails = state.plan
    .map((entry) => {
      const tour = liveTours.find((tourData) => tourData.id === entry.id);
      if (!tour) return null;

      return {
        id: entry.id,
        title: state.lang === 'en' ? tour.titleEn : tour.titleZh,
        startTime: entry.startTime || t('planTbd'),
        durationMinutes: Number.isInteger(entry.durationMinutes)
          ? entry.durationMinutes
          : Math.max(15, Math.round((tour.duration || 1) * 60)),
        participants: Number.isInteger(entry.participants)
          ? entry.participants
          : DEFAULT_PARTICIPANTS,
        notes: typeof entry.notes === 'string' ? entry.notes.trim() : ''
      };
    })
    .filter(Boolean);

  const planNames = planDetails
    .map((entry) => `${entry.title} (${entry.startTime} • ${formatDuration(entry.durationMinutes)}h × ${entry.participants})`)
    .join(' | ');
  const planLines = planDetails
    .map((entry) => {
      const note = entry.notes ? `\n  Note: ${entry.notes}` : '';
      return `- ${entry.title} | ${entry.startTime} | ${formatDuration(entry.durationMinutes)}h | ${entry.participants}x${note}`;
    })
    .join('\n');

  await PandaDB.submitRequest({
    name,
    email,
    date,
    guests: parseInt(guests, 10),
    notes,
    tourIds: planDetails.map((entry) => entry.id),
    tourDetails: planDetails,
    tourNames: planNames
  });

  const body = `
New Booking Request:
Name: ${name}
Email: ${email}
Date: ${date}
Guests: ${guests}

Plan:
${planLines || 'No tours selected.'}

Notes/Requests:
${notes}
  `;

  els.bookingModal.close();
  window.location.href = `mailto:hello@pandaprofessor.com?subject=Tour Request - ${name}&body=${encodeURIComponent(body)}`;

  const successModal = document.getElementById('successModal');
  if (successModal) successModal.showModal();
}

/* ------------------------------------------------------------------ */
/*  Utilities                                                          */
/* ------------------------------------------------------------------ */

/** Initialize scroll reveal animation observer. */
function initReveal() {
  const reveals = document.querySelectorAll('.reveal');
  const revealOnScroll = () => {
    const windowHeight = window.innerHeight;
    const elementVisible = 100;
    reveals.forEach(r => {
      const elementTop = r.getBoundingClientRect().top;
      if (elementTop < windowHeight - elementVisible) {
        r.classList.add('revealed');
      }
    });
  };
  window.addEventListener('scroll', revealOnScroll);
  revealOnScroll();
}

/* ------------------------------------------------------------------ */
/*  Settings                                                           */
/* ------------------------------------------------------------------ */

/** Apply settings from PandaDB */
function applySettings(settings) {
  if (!settings) return;

  applyBrandLogo(resolveBrandLogoUrl(settings));

  const effectiveSiteName = typeof settings.siteName === 'string' && settings.siteName.trim()
    ? settings.siteName.trim()
    : 'Panda Professor';
  
  // Footer site name
  const siteNameDisplay = document.getElementById('siteNameDisplay');
  if (siteNameDisplay) siteNameDisplay.textContent = effectiveSiteName;
  
  // Navbar site name (find the span next to the logo)
  const navBrandSpan = document.getElementById('headerBrandTitle');
  if (navBrandSpan) navBrandSpan.textContent = effectiveSiteName;

  const headerBrandLink = document.getElementById('headerBrandLink');
  if (headerBrandLink) {
    headerBrandLink.setAttribute('aria-label', `${effectiveSiteName} home`);
  }

  const footerBrandLink = document.getElementById('footerBrandLink');
  if (footerBrandLink) {
    footerBrandLink.setAttribute('aria-label', `${effectiveSiteName} home`);
  }
  
  // Chat header name
  const chatHeaderName = document.querySelector('#pandaChatPanel .font-bold');
  if (chatHeaderName) chatHeaderName.textContent = effectiveSiteName;

  // Contact info
  const emailLink = document.getElementById('contactEmailDisplay');
  if (emailLink) {
    const safeEmail = typeof settings.contactEmail === 'string' ? settings.contactEmail.trim() : '';
    if (safeEmail) {
      emailLink.href = `mailto:${safeEmail}`;
      const emailValue = emailLink.querySelector('span.underline');
      if (emailValue) {
        emailValue.textContent = safeEmail;
      }
    }
  }
  
  const phoneLink = document.getElementById('contactPhoneDisplay');
  if (phoneLink) {
    const safePhone = typeof settings.contactPhone === 'string' ? settings.contactPhone.trim() : '';
    if (safePhone) {
      phoneLink.href = `tel:${safePhone.replace(/\s+/g, '')}`;
      const phoneValue = phoneLink.querySelector('span.underline');
      if (phoneValue) {
        phoneValue.textContent = safePhone;
      }
    }
  }

  // Socials
  const socialContainer = document.getElementById('socialLinksContainer');
  if (socialContainer && settings.socials) {
    const socialIcon = {
      instagram: '<img src="icons/instagram.svg" alt="" class="admin-social-link w-4 h-4" aria-hidden="true" />',
      facebook: '<img src="icons/facebook.svg" alt="" class="admin-social-link w-4 h-4" aria-hidden="true" />',
      twitter: '<img src="icons/twitter.svg" alt="" class="admin-social-link w-4 h-4" aria-hidden="true" />',
      weibo: '<img src="icons/weibo.svg" alt="" class="admin-social-link w-4 h-4" aria-hidden="true" />',
      xiaohongshu: '<img src="icons/xiaohongshu.svg" alt="" class="admin-social-link w-4 h-4" aria-hidden="true" />',
      wechat: '<img src="icons/wechat.svg" alt="" class="admin-social-link w-4 h-4" aria-hidden="true" />'
      };

    const resolveWechatTip = (wechatId) => {
      if (!wechatId) return t('footerSocialWeChat');
      return t('footerSocialWeChatTip').replace('{wechatId}', String(wechatId).trim());
    };

    let socialHtml = '';
    const s = settings.socials;
    const socialLinkTemplate = (href, key, iconName) => `<a href="${escapeAttr(href)}" target="_blank" rel="noopener noreferrer" class="btn btn-circle btn-sm btn-ghost bg-base-200 admin-social-link-btn" data-social-label="${key}" aria-label="${t(key)}">${socialIcon[iconName]}</a>`;
    const socialButtonTemplate = (labelKey, iconName, tip) => `<button class="btn btn-circle btn-sm btn-ghost bg-base-200 cursor-default admin-social-link-btn" data-social-label="${labelKey}" data-tip="${tip ? escapeAttr(tip) : ''}" type="button" aria-label="${t(labelKey)}">${socialIcon[iconName]}</button>`;

    if (s.instagram) socialHtml += socialLinkTemplate(s.instagram, 'footerSocialInstagram', 'instagram');
    if (s.facebook) socialHtml += socialLinkTemplate(s.facebook, 'footerSocialFacebook', 'facebook');
    if (s.twitter) socialHtml += socialLinkTemplate(s.twitter, 'footerSocialTwitter', 'twitter');
    if (s.weibo) socialHtml += socialLinkTemplate(s.weibo, 'footerSocialWeibo', 'weibo');
    if (s.xiaohongshu) socialHtml += socialLinkTemplate(s.xiaohongshu, 'footerSocialXiaohongshu', 'xiaohongshu');
    if (s.wechat) {
      socialHtml += `<div class="tooltip tooltip-top" data-tip="${escapeAttr(resolveWechatTip(s.wechat))}">${socialButtonTemplate('footerSocialWeChat', 'wechat')}</div>`;
    }
    
    socialContainer.innerHTML = socialHtml;
    socialContainer.querySelectorAll('[data-social-label]').forEach((socialEl) => {
      const key = socialEl.getAttribute('data-social-label');
      if (key) socialEl.setAttribute('aria-label', t(key));
    });
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  if (settings.chatbot && typeof settings.chatbot === 'object') {
    chatCopyOverrides = { ...settings.chatbot };
    refreshChatLanguage();
  }
}

/* ------------------------------------------------------------------ */
/*  Initialization                                                     */
/* ------------------------------------------------------------------ */

document.addEventListener('DOMContentLoaded', async () => {
  loadFromHash();
  applyTheme();

  /** Attempt IndexedDB, fall back to static data. */
  if (typeof PandaDB !== 'undefined') {
    try {
      await PandaDB.seedIfEmpty();
      liveTours = await PandaDB.fetchTours();
      liveReviews = await PandaDB.fetchReviews();
      liveFaqs = await PandaDB.fetchFaqs();
      liveFacts = normalizeFacts(await PandaDB.fetchFacts());
      
      const settings = await PandaDB.getSettings();
      applySettings(settings);
    } catch (_) {
      liveTours = (window.appData && window.appData.tours) || [];
      liveReviews = (window.appData && window.appData.reviews) || [];
      liveFaqs = (window.appData && window.appData.faqs) || [];
      liveFacts = normalizeFacts(window.appData && window.appData.pandaFacts);
    }
  } else {
    liveTours = (window.appData && window.appData.tours) || [];
    liveReviews = (window.appData && window.appData.reviews) || [];
    liveFaqs = (window.appData && window.appData.faqs) || [];
    liveFacts = normalizeFacts(window.appData && window.appData.pandaFacts);
  }

  /** If DB returned nothing, seed from static data directly. */
  if (liveTours.length === 0 && window.appData && window.appData.tours) {
    liveTours = window.appData.tours;
  }
  if (liveReviews.length === 0 && window.appData && window.appData.reviews) {
    liveReviews = window.appData.reviews;
  }
  if (liveFaqs.length === 0 && window.appData && window.appData.faqs) {
    liveFaqs = window.appData.faqs;
  }
  if (liveFacts.length === 0 && window.appData && window.appData.pandaFacts) {
    liveFacts = normalizeFacts(window.appData.pandaFacts);
  }

  applyTranslations();
  setFilter(state.filter);
  renderPlan();
  renderReviews();
  renderFaqs();
  initReveal();
  bindAppEvents();
  bindChatEvents();

  if (els.chatPanel) {
    els.chatPanel.hidden = true;
    els.chatPanel.style.display = 'none';
    els.chatPanel.classList.remove('flex');
    els.chatPanel.classList.add('hidden');
    els.chatPanel.setAttribute('aria-hidden', 'true');
  }
  if (els.chatTriggerBtn) {
    els.chatTriggerBtn.setAttribute('aria-expanded', 'false');
  }
  if (els.chatMessages) {
    els.chatMessages.setAttribute('role', 'log');
  }

  if (els.searchInput) els.searchInput.addEventListener('input', handleSearch);

  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
});

/* ------------------------------------------------------------------ */
/*  Global Exports                                                     */
/* ------------------------------------------------------------------ */

window.setTheme = setTheme;
window.toggleTheme = setTheme;
window.toggleLanguage = toggleLanguage;
window.setFilter = setFilter;
window.toggleFav = toggleFav;
window.openTourModal = openTourModal;
window.addToPlan = addToPlan;
window.removeFromPlan = removeFromPlan;
window.clearPlan = clearPlan;
window.sharePlan = sharePlan;
window.toggleChat = toggleChat;
window.handleChatSubmit = handleChatSubmit;
window.handleQuickReply = handleQuickReply;
window.submitBooking = submitBooking;
