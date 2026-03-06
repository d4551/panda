/**
 * Panda Professor — Zero-Cost Client-Side Database (localForage)
 *
 * Provides an async data adapter over IndexedDB for:
 * - Tours (CRUD, multilingual)
 * - Booking Requests (create, list, update status)
 * - Admin Auth (local PIN-based session & PIN changing)
 * - Site Settings (name, contact, socials)
 * - FAQs & Reviews (CRUD, multilingual)
 */

const PandaDB = (() => {
  /** @type {LocalForage} */
  const toursStore = localforage.createInstance({ name: 'pandaDB', storeName: 'tours' });
  /** @type {LocalForage} */
  const requestsStore = localforage.createInstance({ name: 'pandaDB', storeName: 'requests' });
  /** @type {LocalForage} */
  const metaStore = localforage.createInstance({ name: 'pandaDB', storeName: 'meta' });
  /** @type {LocalForage} */
  const faqsStore = localforage.createInstance({ name: 'pandaDB', storeName: 'faqs' });
  /** @type {LocalForage} */
  const reviewsStore = localforage.createInstance({ name: 'pandaDB', storeName: 'reviews' });
  /** @type {LocalForage} */
  const imagesStore = localforage.createInstance({ name: 'pandaDB', storeName: 'images' });
  /** @type {LocalForage} */
  const factsStore = localforage.createInstance({ name: 'pandaDB', storeName: 'facts' });

  const DEFAULT_PIN_HASH = '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918'; // 'admin'

  const defaultTranslations = window.appData && window.appData.translations ? window.appData.translations : {};
  const defaultEn = defaultTranslations.en || {};
  const defaultZh = defaultTranslations.zh || {};

  const resolveDefaultChatText = (key, language) => {
    const source = language === 'zh' ? defaultZh : defaultEn;
    const value = source[key];
    return typeof value === 'string' ? value : '';
  };

  const defaultSettings = {
    siteName: 'Panda Professor',
    contactEmail: 'hello@pandaprofessor.com',
    contactPhone: '+86 000 0000 0000',
    logoUrl: 'logo.png',
    socials: {
      instagram: '#',
      facebook: '#',
      twitter: '#',
      wechat: '',
      weibo: '',
      xiaohongshu: ''
    },
    chatbot: {
      chatWelcome: { en: resolveDefaultChatText('chatWelcome', 'en'), zh: resolveDefaultChatText('chatWelcome', 'zh') },
      chatBtnTours: { en: resolveDefaultChatText('chatBtnTours', 'en'), zh: resolveDefaultChatText('chatBtnTours', 'zh') },
      chatBtnFood: { en: resolveDefaultChatText('chatBtnFood', 'en'), zh: resolveDefaultChatText('chatBtnFood', 'zh') },
      chatBtnPanda: { en: resolveDefaultChatText('chatBtnPanda', 'en'), zh: resolveDefaultChatText('chatBtnPanda', 'zh') },
      chatResTours: { en: resolveDefaultChatText('chatResTours', 'en'), zh: resolveDefaultChatText('chatResTours', 'zh') },
      chatResFood: { en: resolveDefaultChatText('chatResFood', 'en'), zh: resolveDefaultChatText('chatResFood', 'zh') },
      chatResPanda: { en: resolveDefaultChatText('chatResPanda', 'en'), zh: resolveDefaultChatText('chatResPanda', 'zh') },
      chatDefaultResponse: { en: resolveDefaultChatText('chatDefaultResponse', 'en'), zh: resolveDefaultChatText('chatDefaultResponse', 'zh') }
    }
  };

  /** Deep merge defaults with stored chatbot settings, keeping localized strings. */
  function buildChatbotSettings(overrides) {
    const safeOverrides = overrides && typeof overrides === 'object' ? overrides : {};
    const merged = {};

    Object.keys(defaultSettings.chatbot || {}).forEach((key) => {
      const base = defaultSettings.chatbot[key] || {};
      const next = safeOverrides[key] && typeof safeOverrides[key] === 'object' ? safeOverrides[key] : {};

      const fallbackEn = typeof base.en === 'string' ? base.en : '';
      const fallbackZh = typeof base.zh === 'string' ? base.zh : '';
      merged[key] = {
        en: typeof next.en === 'string' && next.en.trim() ? next.en.trim() : base.en || '',
        zh: typeof next.zh === 'string' && next.zh.trim() ? next.zh.trim() : base.zh || ''
      };

      if (!merged[key].en) merged[key].en = fallbackEn;
      if (!merged[key].zh) merged[key].zh = fallbackZh;
    });

    return merged;
  }

  /**
   * Hash a string using SHA-256.
   * @param {string} str
   * @returns {Promise<string>}
   */
  async function sha256(str) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Seed the stores with data from window.appData if the DB is empty.
   * @returns {Promise<void>}
   */
  async function seedIfEmpty() {
    const count = await toursStore.length();
    if (count > 0) return;

    const seedTours = window.appData && window.appData.tours ? window.appData.tours : [];
    for (const tour of seedTours) {
      await toursStore.setItem(tour.id, { ...tour, isActive: true, createdAt: Date.now() });
    }

    const seedFaqs = window.appData && window.appData.faqs ? window.appData.faqs : [];
    for (let i = 0; i < seedFaqs.length; i++) {
      const f = seedFaqs[i];
      await faqsStore.setItem(f.id || `f_${Date.now()}_${i}`, { ...f, id: f.id || `f_${Date.now()}_${i}`, createdAt: Date.now() });
    }

    const seedReviews = window.appData && window.appData.reviews ? window.appData.reviews : [];
    for (let i = 0; i < seedReviews.length; i++) {
      const r = seedReviews[i];
      await reviewsStore.setItem(r.id || `r_${Date.now()}_${i}`, { ...r, id: r.id || `r_${Date.now()}_${i}`, createdAt: Date.now() });
    }

    const initialImages = [
      'images/panda1.jpg', 'images/panda2.jpg', 'images/panda3.jpg', 'images/panda4.jpg',
      'images/panda5.jpg', 'images/panda6.jpg', 'images/panda7.jpg', 'images/panda8.jpg',
      'images/panda9.jpg', 'images/panda10.jpg'
    ];
    for (let i = 0; i < initialImages.length; i++) {
      const imgId = `img_seed_${i}`;
      await imagesStore.setItem(imgId, { id: imgId, url: initialImages[i], createdAt: Date.now() + i });
    }

    const seedFacts = window.appData && window.appData.pandaFacts ? window.appData.pandaFacts : [];
    for (let i = 0; i < seedFacts.length; i++) {
      const f = seedFacts[i];
      await factsStore.setItem(f.id || `fact_${Date.now()}_${i}`, { ...f, id: f.id || `fact_${Date.now()}_${i}`, createdAt: Date.now() });
    }

    await metaStore.setItem('seeded', true);
  }

  /* ---- TOURS ---- */
  async function fetchTours(opts = {}) {
    const all = [];
    await toursStore.iterate((value) => {
      if (opts.includeInactive || value.isActive !== false) all.push(value);
    });
    return all;
  }
  async function getTour(id) { return toursStore.getItem(id); }
  async function saveTour(tourData) {
    const id = tourData.id || `t_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const record = { ...tourData, id, updatedAt: Date.now() };
    if (!record.createdAt) record.createdAt = Date.now();
    if (record.isActive === undefined) record.isActive = true;
    await toursStore.setItem(id, record);
    return record;
  }
  async function deleteTour(id) { return toursStore.removeItem(id); }

  /* ---- FAQS ---- */
  async function fetchFaqs() {
    const all = [];
    await faqsStore.iterate((value) => { all.push(value); });
    all.sort((a, b) => a.createdAt - b.createdAt); // Keep chronological order
    return all;
  }
  async function getFaq(id) { return faqsStore.getItem(id); }
  async function saveFaq(data) {
    const id = data.id || `f_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const record = { ...data, id, updatedAt: Date.now() };
    if (!record.createdAt) record.createdAt = Date.now();
    await faqsStore.setItem(id, record);
    return record;
  }
  async function deleteFaq(id) { return faqsStore.removeItem(id); }

  /* ---- REVIEWS ---- */
  async function fetchReviews() {
    const all = [];
    await reviewsStore.iterate((value) => { all.push(value); });
    all.sort((a, b) => a.createdAt - b.createdAt);
    return all;
  }
  async function getReview(id) { return reviewsStore.getItem(id); }
  async function saveReview(data) {
    const id = data.id || `r_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const record = { ...data, id, updatedAt: Date.now() };
    if (!record.createdAt) record.createdAt = Date.now();
    await reviewsStore.setItem(id, record);
    return record;
  }
  async function deleteReview(id) { return reviewsStore.removeItem(id); }

  /* ---- FACTS ---- */
  async function fetchFacts() {
    const all = [];
    await factsStore.iterate((value) => { all.push(value); });
    all.sort((a, b) => a.createdAt - b.createdAt);
    return all;
  }
  async function getFact(id) { return factsStore.getItem(id); }
  async function saveFact(data) {
    const id = data.id || `fact_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const record = { ...data, id, updatedAt: Date.now() };
    if (!record.createdAt) record.createdAt = Date.now();
    await factsStore.setItem(id, record);
    return record;
  }
  async function deleteFact(id) { return factsStore.removeItem(id); }

  /* ---- IMAGES ---- */
  async function fetchImages() {
    const all = [];
    await imagesStore.iterate((value) => { all.push(value); });
    all.sort((a, b) => b.createdAt - a.createdAt);
    return all;
  }
  async function saveImage(data) {
    const id = data.id || `img_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const record = { ...data, id, createdAt: data.createdAt || Date.now() };
    await imagesStore.setItem(id, record);
    return record;
  }
  async function deleteImage(id) { return imagesStore.removeItem(id); }

  /* ---- REQUESTS ---- */
  async function submitRequest(data) {
    const id = `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const record = { id, ...data, status: 'pending', createdAt: Date.now() };
    await requestsStore.setItem(id, record);
    return record;
  }
  async function getRequests() {
    const all = [];
    await requestsStore.iterate((value) => { all.push(value); });
    all.sort((a, b) => b.createdAt - a.createdAt);
    return all;
  }
  async function updateRequestStatus(id, status) {
    const record = await requestsStore.getItem(id);
    if (!record) return null;
    record.status = status;
    record.updatedAt = Date.now();
    await requestsStore.setItem(id, record);
    return record;
  }

  /* ---- ADMIN & SETTINGS ---- */
  async function getPinHash() {
    const hash = await metaStore.getItem('admin_pin_hash');
    return hash || DEFAULT_PIN_HASH;
  }
  async function setPin(newPin) {
    const hash = await sha256(newPin);
    await metaStore.setItem('admin_pin_hash', hash);
  }
  async function loginAdmin(pin) {
    const hash = await sha256(pin);
    const expectedHash = await getPinHash();
    if (hash === expectedHash) {
      const token = crypto.randomUUID();
      sessionStorage.setItem('pp_admin_token', token);
      return true;
    }
    return false;
  }
  function isAdminLoggedIn() { return !!sessionStorage.getItem('pp_admin_token'); }
  function logoutAdmin() { sessionStorage.removeItem('pp_admin_token'); }

  async function getSettings() {
    const settings = await metaStore.getItem('site_settings');
    if (!settings) return defaultSettings;
    return {
      ...defaultSettings,
      ...settings,
      logoUrl: typeof settings.logoUrl === 'string' && settings.logoUrl.trim()
        ? settings.logoUrl.trim()
        : defaultSettings.logoUrl,
      socials: { ...defaultSettings.socials, ...(settings.socials || {}) },
      chatbot: buildChatbotSettings(settings.chatbot || {})
    };
  }
  async function saveSettings(newSettings) {
    await metaStore.setItem('site_settings', newSettings);
  }

  return {
    seedIfEmpty,
    
    fetchTours, getTour, saveTour, deleteTour,
    fetchFaqs, getFaq, saveFaq, deleteFaq,
    fetchReviews, getReview, saveReview, deleteReview,
    fetchFacts, getFact, saveFact, deleteFact,
    fetchImages, saveImage, deleteImage,
    submitRequest, getRequests, updateRequestStatus,
    
    setPin, loginAdmin, isAdminLoggedIn, logoutAdmin,
    getSettings, saveSettings
  };
})();

window.PandaDB = PandaDB;
