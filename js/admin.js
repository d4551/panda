/**
 * Panda Professor — Admin Dashboard Logic
 */

const dbStores = {
  tours: localforage.createInstance({ name: 'pandaDB', storeName: 'tours' }),
  requests: localforage.createInstance({ name: 'pandaDB', storeName: 'requests' })
};

/**
 * Shared translation dictionary from data.js.
 * @type {{ [key: string]: { [key: string]: string } }}
 */
const adminTranslations = window.appData && window.appData.translations ? window.appData.translations : {};

/** @type {'en' | 'zh'} */
let adminLang = localStorage.getItem('pp_lang') === 'zh' ? 'zh' : 'en';
/** @type {'en' | 'zh'} */
const adminFallbackLanguage = 'en';
/** Active admin logo source. */
let adminLogoSrc = 'logo.png';

/**
 * Resolve translation for current admin locale with deterministic fallback.
 * @param {string} key
 * @returns {string}
 */
function adminT(key) {
  return adminTranslations[adminLang]?.[key] || adminTranslations[adminFallbackLanguage]?.[key] || key;
}

/**
 * Resolve brand logo URL from settings with fallback.
 * @param {*} settings
 * @returns {string}
 */
function resolveAdminLogoUrl(settings) {
  const raw = settings && typeof settings.logoUrl === 'string' ? settings.logoUrl.trim() : '';
  return raw || 'logo.png';
}

/**
 * Apply configured logo to admin brand images and settings preview.
 * @param {*} settings
 */
function applyAdminBranding(settings) {
  adminLogoSrc = resolveAdminLogoUrl(settings);
  document.querySelectorAll('[data-admin-logo]').forEach((logoEl) => {
    logoEl.setAttribute('src', adminLogoSrc);
  });
}

/**
 * Return true for placeholders that should be translated by data-i18n-admin.
 * @param {HTMLElement} el
 * @returns {boolean}
 */
  function isAdminInputElement(el) {
    return el.tagName === 'TEXTAREA' || (el.tagName === 'INPUT' && !['button', 'submit', 'checkbox', 'radio', 'file'].includes(el.type));
  }

  /** Apply translated attributes using data-admin-i18n-attr. */
  function applyAdminTranslatedAttributes(el) {
    const spec = el.getAttribute('data-admin-i18n-attr');
    if (!spec) return;

    spec.split(';').forEach((item) => {
      const [attribute, key] = item.split(':').map((part) => part && part.trim());
      if (!attribute || !key) return;
      el.setAttribute(attribute, adminT(key));
    });
  }

  /** Apply translations to all elements with data-i18n-admin attribute. */
  function applyAdminTranslations() {
    document.documentElement.setAttribute('lang', adminLang);

  document.querySelectorAll('[data-i18n-admin]').forEach(el => {
    const key = el.getAttribute('data-i18n-admin');
    const label = adminT(key);

    if (!label) return;

    if (el.tagName === 'META' && el.hasAttribute('content')) {
      el.setAttribute('content', label);
    } else if (isAdminInputElement(el)) {
      el.placeholder = label;
    } else {
      el.textContent = label;
    }
    });

    document.querySelectorAll('[data-admin-i18n-attr]').forEach(applyAdminTranslatedAttributes);

    const buttonText = adminLang === 'en' ? 'EN' : '中文';
  const toggle1 = document.getElementById('adminLangToggle');
  const toggle2 = document.getElementById('adminLangToggleDashboard');
  if (toggle1) toggle1.textContent = buttonText;
  if (toggle2) toggle2.textContent = buttonText;
}

/** Toggle between EN and ZH for admin. */
async function toggleAdminLanguage() {
  adminLang = adminLang === 'en' ? 'zh' : 'en';
  localStorage.setItem('pp_lang', adminLang);
  applyAdminTranslations();
  if (PandaDB.isAdminLoggedIn()) {
    await refreshAll();
  }
  lucide.createIcons();
}

/* ---- Auth ---- */

/** @param {Event} e */
async function handleLogin(e) {
  e.preventDefault();
  const pin = document.getElementById('pinInput').value;
  const success = await PandaDB.loginAdmin(pin);

  if (success) {
    showDashboard();
  } else {
    document.getElementById('loginError').classList.remove('hidden');
    document.getElementById('pinInput').value = '';
    document.getElementById('pinInput').focus();
  }
}

function handleLogout() {
  PandaDB.logoutAdmin();
  document.getElementById('dashboardView').classList.add('hidden');
  document.getElementById('loginView').classList.remove('hidden');
  document.getElementById('pinInput').value = '';
}

async function showDashboard() {
  document.getElementById('loginView').classList.add('hidden');
  document.getElementById('dashboardView').classList.remove('hidden');
  applyAdminTranslations();
  await refreshAll();
  lucide.createIcons();
}

/* ---- Tab Switching ---- */

function switchTab(tab, btn) {
  document.querySelectorAll('[role="tab"]').forEach(t => t.classList.remove('tab-active'));
  btn.classList.add('tab-active');

  document.getElementById('requestsTab').classList.toggle('hidden', tab !== 'requests');
  document.getElementById('toursTab').classList.toggle('hidden', tab !== 'tours');
  document.getElementById('galleryTab').classList.toggle('hidden', tab !== 'gallery');
  document.getElementById('settingsTab').classList.toggle('hidden', tab !== 'settings');
  document.getElementById('reviewsTab').classList.toggle('hidden', tab !== 'reviews');
  document.getElementById('faqsTab').classList.toggle('hidden', tab !== 'faqs');
}

/* ---- Refresh All Data ---- */

async function refreshAll() {
  const tours = await PandaDB.fetchTours({ includeInactive: true });
  const requests = await PandaDB.getRequests();
  const reviews = await PandaDB.fetchReviews();
  const faqs = await PandaDB.fetchFaqs();
  const images = await PandaDB.fetchImages();

  const pending = requests.filter(r => r.status === 'pending').length;
  const resolved = requests.filter(r => r.status === 'resolved').length;

  document.getElementById('statTourCount').textContent = tours.filter(t => t.isActive !== false).length;
  document.getElementById('statPendingCount').textContent = pending;
  document.getElementById('statResolvedCount').textContent = resolved;

  renderRequestsTable(requests);
  renderToursAdmin(tours);
  renderGalleryAdmin(images);
  renderReviewsAdmin(reviews);
  renderFaqsAdmin(faqs);
  await loadSettings();
}

/* ---- Gallery Tab ---- */

function renderGalleryAdmin(images) {
  const grid = document.getElementById('galleryAdminGrid');
  grid.innerHTML = images.map(img => `
    <div class="card bg-base-100 shadow-sm border border-base-200">
      <figure class="h-32 relative group">
        <img src="${img.url}" class="w-full h-full object-cover" loading="lazy" />
        <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button class="btn btn-circle btn-sm btn-ghost text-white" data-admin-action="copy-image-url" data-image-url="${encodeURIComponent(img.url)}" title="${adminT('adminGalleryCopyUrlTitle')}"><i data-lucide="copy" class="w-4 h-4"></i></button>
          <button class="btn btn-circle btn-sm btn-error" data-admin-action="delete-image" data-image-id="${img.id}" title="${adminT('adminGalleryDeleteTitle')}"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
        </div>
      </figure>
    </div>
  `).join('');
}

async function handleImageUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (event) => {
    const base64 = event.target.result;
    await PandaDB.saveImage({ url: base64 });
    document.getElementById('imageUploadInput').value = '';
    await refreshAll();
    lucide.createIcons();
  };
  reader.readAsDataURL(file);
}

async function confirmDeleteImage(id) {
  if (confirm(adminT('adminDeleteImageConfirm'))) {
    await PandaDB.deleteImage(id);
    await refreshAll();
    lucide.createIcons();
  }
}

function copyImageUrl(url) {
  navigator.clipboard.writeText(url).then(() => {
    alert(adminT('adminImageCopiedAlert'));
  });
}

/* ---- Reviews Tab ---- */

function renderReviewsAdmin(reviews) {
  const grid = document.getElementById('reviewsAdminGrid');
  grid.innerHTML = reviews.map(r => `
      <div class="card bg-base-100 shadow-sm border border-base-200">
        <div class="card-body p-4">
          <h3 class="card-title text-sm">${esc(r.name)} (${esc(r.country)})</h3>
          <p class="text-xs opacity-80 mt-2 line-clamp-2"><strong>${adminT('adminLabelEnglish')}:</strong> ${esc(r.textEn)}</p>
          <p class="text-xs opacity-80 line-clamp-2"><strong>${adminT('adminLabelChinese')}:</strong> ${esc(r.textZh)}</p>
        <div class="card-actions mt-3">
          <button class="btn btn-outline btn-xs" data-admin-action="edit-review" data-review-id="${r.id}"><i data-lucide="pencil" class="w-3 h-3 mr-1"></i> ${adminT('adminEdit')}</button>
          <button class="btn btn-outline btn-xs btn-error" data-admin-action="delete-review" data-review-id="${r.id}" data-review-name="${encodeURIComponent(r.name)}"><i data-lucide="trash-2" class="w-3 h-3 mr-1"></i> ${adminT('adminDelete')}</button>
        </div>
      </div>
    </div>
  `).join('');
}

function openReviewForm(existing) {
  const form = document.getElementById('reviewForm');
  form.reset();
  document.getElementById('rf_id').value = '';
  document.getElementById('reviewFormTitle').innerHTML = `<i data-lucide="message-square-quote" class="text-primary w-5 h-5"></i> ${adminT('adminAddReview')}`;

  if (existing) {
    document.getElementById('reviewFormTitle').innerHTML = `<i data-lucide="pencil" class="text-primary w-5 h-5"></i> ${adminT('adminEditReview')}`;
    document.getElementById('rf_id').value = existing.id;
    document.getElementById('rf_name').value = existing.name || '';
    document.getElementById('rf_country').value = existing.country || '';
    document.getElementById('rf_textEn').value = existing.textEn || '';
    document.getElementById('rf_textZh').value = existing.textZh || '';
  }

  document.getElementById('reviewFormModal').showModal();
  lucide.createIcons();
}

async function editReview(id) {
  const review = await PandaDB.getReview(id);
  if (review) openReviewForm(review);
}

async function saveReviewForm(e) {
  e.preventDefault();
  const id = document.getElementById('rf_id').value || undefined;
  await PandaDB.saveReview({
    id,
    name: document.getElementById('rf_name').value.trim(),
    country: document.getElementById('rf_country').value.trim(),
    textEn: document.getElementById('rf_textEn').value.trim(),
    textZh: document.getElementById('rf_textZh').value.trim()
  });
  document.getElementById('reviewFormModal').close();
  await refreshAll();
  lucide.createIcons();
}

async function confirmDeleteReview(id, name) {
  const confirmMessage = adminT('adminDeleteReviewConfirmTemplate').replace('{name}', name);
  if (confirm(confirmMessage)) {
    await PandaDB.deleteReview(id);
    await refreshAll();
    lucide.createIcons();
  }
}

/* ---- FAQs Tab ---- */

function renderFaqsAdmin(faqs) {
  const list = document.getElementById('faqsAdminList');
  list.innerHTML = faqs.map(f => `
    <div class="card bg-base-100 shadow-sm border border-base-200">
      <div class="card-body p-4">
        <h3 class="font-bold text-sm">${adminT('adminLabelEnglish')}: ${esc(f.qEn)}</h3>
        <p class="text-xs opacity-80 mb-2"><strong>${adminT('adminAnswerLabel')}:</strong> ${esc(f.aEn)}</p>
        <h3 class="font-bold text-sm mt-2">${adminT('adminLabelChinese')}: ${esc(f.qZh)}</h3>
        <p class="text-xs opacity-80"><strong>${adminT('adminAnswerLabel')}:</strong> ${esc(f.aZh)}</p>
        <div class="card-actions mt-3">
          <button class="btn btn-outline btn-xs" data-admin-action="edit-faq" data-faq-id="${f.id}"><i data-lucide="pencil" class="w-3 h-3 mr-1"></i> ${adminT('adminEdit')}</button>
          <button class="btn btn-outline btn-xs btn-error" data-admin-action="delete-faq" data-faq-id="${f.id}"><i data-lucide="trash-2" class="w-3 h-3 mr-1"></i> ${adminT('adminDelete')}</button>
        </div>
      </div>
    </div>
  `).join('');
}

function openFaqForm(existing) {
  const form = document.getElementById('faqForm');
  form.reset();
  document.getElementById('ff_id').value = '';
  document.getElementById('faqFormTitle').innerHTML = `<i data-lucide="help-circle" class="text-primary w-5 h-5"></i> ${adminT('adminAddFaq')}`;

  if (existing) {
    document.getElementById('faqFormTitle').innerHTML = `<i data-lucide="pencil" class="text-primary w-5 h-5"></i> ${adminT('adminEditFaq')}`;
    document.getElementById('ff_id').value = existing.id;
    document.getElementById('ff_qEn').value = existing.qEn || '';
    document.getElementById('ff_qZh').value = existing.qZh || '';
    document.getElementById('ff_aEn').value = existing.aEn || '';
    document.getElementById('ff_aZh').value = existing.aZh || '';
  }

  document.getElementById('faqFormModal').showModal();
  lucide.createIcons();
}

async function editFaq(id) {
  const faq = await PandaDB.getFaq(id);
  if (faq) openFaqForm(faq);
}

async function saveFaqForm(e) {
  e.preventDefault();
  const id = document.getElementById('ff_id').value || undefined;
  await PandaDB.saveFaq({
    id,
    qEn: document.getElementById('ff_qEn').value.trim(),
    qZh: document.getElementById('ff_qZh').value.trim(),
    aEn: document.getElementById('ff_aEn').value.trim(),
    aZh: document.getElementById('ff_aZh').value.trim()
  });
  document.getElementById('faqFormModal').close();
  await refreshAll();
  lucide.createIcons();
}

async function confirmDeleteFaq(id) {
  if (confirm(adminT('adminDeleteFaqConfirm'))) {
    await PandaDB.deleteFaq(id);
    await refreshAll();
    lucide.createIcons();
  }
}

/* ---- Settings Tab ---- */

async function loadSettings() {
  const settings = await PandaDB.getSettings();
  applyAdminBranding(settings);
  document.getElementById('set_siteName').value = settings.siteName || '';
  document.getElementById('set_email').value = settings.contactEmail || '';
  document.getElementById('set_phone').value = settings.contactPhone || '';
  document.getElementById('set_logoUrl').value = settings.logoUrl || '';
  document.getElementById('set_instagram').value = settings.socials.instagram || '';
  document.getElementById('set_facebook').value = settings.socials.facebook || '';
  document.getElementById('set_twitter').value = settings.socials.twitter || '';
  document.getElementById('set_wechat').value = settings.socials.wechat || '';
  document.getElementById('set_weibo').value = settings.socials.weibo || '';
  document.getElementById('set_xiaohongshu').value = settings.socials.xiaohongshu || '';

  const chatbot = settings.chatbot || {};
  document.getElementById('set_chatWelcomeEn').value = (chatbot.chatWelcome && chatbot.chatWelcome.en) || '';
  document.getElementById('set_chatWelcomeZh').value = (chatbot.chatWelcome && chatbot.chatWelcome.zh) || '';
  document.getElementById('set_chatBtnToursEn').value = (chatbot.chatBtnTours && chatbot.chatBtnTours.en) || '';
  document.getElementById('set_chatBtnToursZh').value = (chatbot.chatBtnTours && chatbot.chatBtnTours.zh) || '';
  document.getElementById('set_chatBtnFoodEn').value = (chatbot.chatBtnFood && chatbot.chatBtnFood.en) || '';
  document.getElementById('set_chatBtnFoodZh').value = (chatbot.chatBtnFood && chatbot.chatBtnFood.zh) || '';
  document.getElementById('set_chatBtnPandaEn').value = (chatbot.chatBtnPanda && chatbot.chatBtnPanda.en) || '';
  document.getElementById('set_chatBtnPandaZh').value = (chatbot.chatBtnPanda && chatbot.chatBtnPanda.zh) || '';
  document.getElementById('set_chatResToursEn').value = (chatbot.chatResTours && chatbot.chatResTours.en) || '';
  document.getElementById('set_chatResToursZh').value = (chatbot.chatResTours && chatbot.chatResTours.zh) || '';
  document.getElementById('set_chatResFoodEn').value = (chatbot.chatResFood && chatbot.chatResFood.en) || '';
  document.getElementById('set_chatResFoodZh').value = (chatbot.chatResFood && chatbot.chatResFood.zh) || '';
  document.getElementById('set_chatResPandaEn').value = (chatbot.chatResPanda && chatbot.chatResPanda.en) || '';
  document.getElementById('set_chatResPandaZh').value = (chatbot.chatResPanda && chatbot.chatResPanda.zh) || '';
  document.getElementById('set_chatDefaultResponseEn').value = (chatbot.chatDefaultResponse && chatbot.chatDefaultResponse.en) || '';
  document.getElementById('set_chatDefaultResponseZh').value = (chatbot.chatDefaultResponse && chatbot.chatDefaultResponse.zh) || '';
}

async function handleSettingsSave(e) {
  e.preventDefault();
  const settings = {
    siteName: document.getElementById('set_siteName').value.trim(),
    contactEmail: document.getElementById('set_email').value.trim(),
    contactPhone: document.getElementById('set_phone').value.trim(),
    logoUrl: document.getElementById('set_logoUrl').value.trim(),
    socials: {
      instagram: document.getElementById('set_instagram').value.trim(),
      facebook: document.getElementById('set_facebook').value.trim(),
      twitter: document.getElementById('set_twitter').value.trim(),
      wechat: document.getElementById('set_wechat').value.trim(),
      weibo: document.getElementById('set_weibo').value.trim(),
      xiaohongshu: document.getElementById('set_xiaohongshu').value.trim()
    },
    chatbot: {
      chatWelcome: {
        en: document.getElementById('set_chatWelcomeEn').value.trim(),
        zh: document.getElementById('set_chatWelcomeZh').value.trim()
      },
      chatBtnTours: {
        en: document.getElementById('set_chatBtnToursEn').value.trim(),
        zh: document.getElementById('set_chatBtnToursZh').value.trim()
      },
      chatBtnFood: {
        en: document.getElementById('set_chatBtnFoodEn').value.trim(),
        zh: document.getElementById('set_chatBtnFoodZh').value.trim()
      },
      chatBtnPanda: {
        en: document.getElementById('set_chatBtnPandaEn').value.trim(),
        zh: document.getElementById('set_chatBtnPandaZh').value.trim()
      },
      chatResTours: {
        en: document.getElementById('set_chatResToursEn').value.trim(),
        zh: document.getElementById('set_chatResToursZh').value.trim()
      },
      chatResFood: {
        en: document.getElementById('set_chatResFoodEn').value.trim(),
        zh: document.getElementById('set_chatResFoodZh').value.trim()
      },
      chatResPanda: {
        en: document.getElementById('set_chatResPandaEn').value.trim(),
        zh: document.getElementById('set_chatResPandaZh').value.trim()
      },
      chatDefaultResponse: {
        en: document.getElementById('set_chatDefaultResponseEn').value.trim(),
        zh: document.getElementById('set_chatDefaultResponseZh').value.trim()
      }
    }
  };
  applyAdminBranding(settings);
  await PandaDB.saveSettings(settings);
  
  const msg = document.getElementById('settingsSuccessMsg');
  msg.classList.remove('hidden');
  setTimeout(() => msg.classList.add('hidden'), 3000);
}

async function handlePinChange(e) {
  e.preventDefault();
  const newPin = document.getElementById('newPinInput').value;
  if (newPin.length < 4) return;
  
  await PandaDB.setPin(newPin);
  document.getElementById('newPinInput').value = '';
  
  const msg = document.getElementById('pinSuccessMsg');
  msg.classList.remove('hidden');
  setTimeout(() => msg.classList.add('hidden'), 3000);
}

/* ---- Requests Table ---- */

function renderRequestsTable(requests) {
  const tbody = document.getElementById('requestsTableBody');
  const noReqs = document.getElementById('noRequests');

  if (requests.length === 0) {
    tbody.innerHTML = '';
    noReqs.classList.remove('hidden');
    return;
  }

  noReqs.classList.add('hidden');

  tbody.innerHTML = requests.map(r => {
    const locale = adminLang === 'zh' ? 'zh-CN' : 'en-US';
    const date = new Date(r.createdAt).toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' });
    const statusBadge = r.status === 'pending'
      ? `<span class="badge badge-warning badge-sm">${adminT('adminStatusPending')}</span>`
      : r.status === 'contacted'
        ? `<span class="badge badge-info badge-sm">${adminT('adminStatusContacted')}</span>`
        : `<span class="badge badge-success badge-sm">${adminT('adminStatusResolved')}</span>`;

    return `
      <tr>
        <td class="text-sm">${date}</td>
        <td class="font-medium">${esc(r.name)}</td>
        <td class="text-sm"><a href="mailto:${esc(r.email)}" class="link link-primary">${esc(r.email)}</a></td>
        <td class="text-center">${r.guests || '—'}</td>
        <td class="text-sm max-w-[200px] truncate" title="${esc(r.tourNames || '')}">${esc(r.tourNames || '—')}</td>
        <td>${statusBadge}</td>
        <td>
          <div class="flex gap-1">
            <a href="mailto:${esc(r.email)}?subject=${encodeURIComponent(adminT('adminRequestEmailSubject'))}" class="btn btn-xs btn-outline"><i data-lucide="mail" class="w-3 h-3"></i> ${adminT('adminStatusEmailBtn')}</a>
            ${r.status !== 'contacted' ? `<button class="btn btn-xs btn-info" data-admin-action="mark-request" data-request-id="${r.id}" data-request-status="contacted">${adminT('adminStatusContactBtn')}</button>` : ''}
            ${r.status !== 'resolved' ? `<button class="btn btn-xs btn-success" data-admin-action="mark-request" data-request-id="${r.id}" data-request-status="resolved">${adminT('adminStatusResolveBtn')}</button>` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

/**
 * Update request status.
 * @param {string} id
 * @param {string} status
 */
async function markRequest(id, status) {
  await PandaDB.updateRequestStatus(id, status);
  await refreshAll();
  lucide.createIcons();
}

/* ---- Tours Admin Grid ---- */

function renderToursAdmin(tours) {
  const grid = document.getElementById('toursAdminGrid');

  grid.innerHTML = tours.map(t => `
    <div class="card bg-base-100 shadow-sm border border-base-200 ${t.isActive === false ? 'opacity-60' : ''}">
    <figure class="h-36 relative">
        <img src="${t.image}" alt="${t.titleEn}" class="w-full h-full object-cover" loading="lazy" />
        <div class="absolute top-2 right-2 flex gap-1">
          ${t.popular ? `<span class="badge badge-warning badge-sm">${adminT('adminTourBadgePopular')}</span>` : ''}
          ${t.isActive === false ? `<span class="badge badge-error badge-sm">${adminT('adminTourBadgeHidden')}</span>` : `<span class="badge badge-success badge-sm">${adminT('adminTourBadgeActive')}</span>`}
        </div>
      </figure>
      <div class="card-body p-4">
        <h3 class="card-title text-sm">${esc(t.titleEn)}</h3>
        <p class="text-xs opacity-60">${esc(t.titleZh)}</p>
        <div class="text-sm font-bold mt-1">¥${t.price} <span class="font-normal text-xs opacity-60">/ ${t.duration}h</span></div>
        <div class="card-actions mt-2">
          <button class="btn btn-outline btn-xs" data-admin-action="edit-tour" data-tour-id="${t.id}">
            <i data-lucide="pencil" class="w-3 h-3 mr-1"></i> ${adminT('adminEdit')}
          </button>
          <button class="btn btn-outline btn-xs btn-error" data-admin-action="delete-tour" data-tour-id="${t.id}" data-tour-title="${encodeURIComponent(t.titleEn)}">
            <i data-lucide="trash-2" class="w-3 h-3 mr-1"></i> ${adminT('adminDelete')}
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

/* ---- Tour Form (Add / Edit) ---- */

function openTourForm(existing) {
  const form = document.getElementById('tourForm');
  form.reset();
  document.getElementById('tf_id').value = '';
  document.getElementById('tourFormTitle').innerHTML = `<i data-lucide="plus-circle" class="text-primary w-5 h-5"></i> ${adminT('adminAddNewTourFormTitle')}`;

  if (existing) {
    document.getElementById('tourFormTitle').innerHTML = `<i data-lucide="pencil" class="text-primary w-5 h-5"></i> ${adminT('adminEditTour')}`;
    document.getElementById('tf_id').value = existing.id;
    document.getElementById('tf_titleEn').value = existing.titleEn || '';
    document.getElementById('tf_titleZh').value = existing.titleZh || '';
    document.getElementById('tf_descEn').value = existing.descEn || '';
    document.getElementById('tf_descZh').value = existing.descZh || '';
    document.getElementById('tf_price').value = existing.price || '';
    document.getElementById('tf_duration').value = existing.duration || '';
    document.getElementById('tf_image').value = existing.image || '';
    document.getElementById('tf_tags').value = (existing.tags || []).join(', ');
    document.getElementById('tf_active').value = existing.isActive !== false ? 'true' : 'false';
    document.getElementById('tf_popular').checked = !!existing.popular;
  }

  document.getElementById('tourFormModal').showModal();
  lucide.createIcons();
}

async function editTour(id) {
  const tour = await PandaDB.getTour(id);
  if (tour) openTourForm(tour);
}

/**
 * Save tour form (create or update).
 * @param {Event} e
 */
async function saveTourForm(e) {
  e.preventDefault();

  const id = document.getElementById('tf_id').value || undefined;
  const tourData = {
    id,
    titleEn: document.getElementById('tf_titleEn').value.trim(),
    titleZh: document.getElementById('tf_titleZh').value.trim(),
    descEn: document.getElementById('tf_descEn').value.trim(),
    descZh: document.getElementById('tf_descZh').value.trim(),
    price: parseFloat(document.getElementById('tf_price').value),
    duration: parseFloat(document.getElementById('tf_duration').value),
    image: document.getElementById('tf_image').value.trim(),
    tags: document.getElementById('tf_tags').value.split(',').map(s => s.trim()).filter(Boolean),
    isActive: document.getElementById('tf_active').value === 'true',
    popular: document.getElementById('tf_popular').checked,
    inclusionsEn: [],
    inclusionsZh: [],
    exclusionsEn: [],
    exclusionsZh: []
  };

  // If editing, preserve existing inclusions/exclusions
  if (id) {
    const existing = await PandaDB.getTour(id);
    if (existing) {
      tourData.inclusionsEn = existing.inclusionsEn || [];
      tourData.inclusionsZh = existing.inclusionsZh || [];
      tourData.exclusionsEn = existing.exclusionsEn || [];
      tourData.exclusionsZh = existing.exclusionsZh || [];
      tourData.createdAt = existing.createdAt;
    }
  }

  await PandaDB.saveTour(tourData);
  document.getElementById('tourFormModal').close();
  await refreshAll();
  lucide.createIcons();
}

async function confirmDeleteTour(id, name) {
  const confirmMessage = adminT('adminDeleteTourConfirmTemplate').replace('{name}', name);
  if (confirm(confirmMessage)) {
    await PandaDB.deleteTour(id);
    await refreshAll();
    lucide.createIcons();
  }
}

/* ---- Utilities ---- */

/**
 * Escape HTML to prevent XSS.
 * @param {string} str
 * @returns {string}
 */
function esc(str) {
  const d = document.createElement('div');
  d.textContent = str || '';
  return d.innerHTML;
}

/** Decode URI encoded metadata from admin action attributes. */
function decodeAdminAttribute(value) {
  if (!value) return '';
  try {
    return decodeURIComponent(value);
  } catch {
    return '';
  }
}

function closeAdminModal(modalId) {
  if (!modalId) return;
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.close();
  }
}

/** Bind admin actions and form submissions without inline HTML handlers. */
function bindAdminEvents() {
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }

  const imageUploadButton = document.getElementById('imageUploadButton');
  const imageUploadInput = document.getElementById('imageUploadInput');
  if (imageUploadButton && imageUploadInput) {
    imageUploadButton.addEventListener('click', () => imageUploadInput.click());
  }

  const imageUploader = document.getElementById('imageUploadInput');
  if (imageUploader) {
    imageUploader.addEventListener('change', handleImageUpload);
  }

  const pinForm = document.getElementById('adminPinForm');
  if (pinForm) {
    pinForm.addEventListener('submit', handlePinChange);
  }

  const settingsForm = document.getElementById('adminSettingsForm');
  if (settingsForm) {
    settingsForm.addEventListener('submit', handleSettingsSave);
  }

  const logoInput = document.getElementById('set_logoUrl');
  if (logoInput) {
    logoInput.addEventListener('input', () => {
      applyAdminBranding({ logoUrl: logoInput.value });
    });
  }

  const reviewForm = document.getElementById('reviewForm');
  if (reviewForm) {
    reviewForm.addEventListener('submit', saveReviewForm);
  }

  const faqForm = document.getElementById('faqForm');
  if (faqForm) {
    faqForm.addEventListener('submit', saveFaqForm);
  }

  const tourForm = document.getElementById('tourForm');
  if (tourForm) {
    tourForm.addEventListener('submit', saveTourForm);
  }

  document.addEventListener('click', (event) => {
    const actionButton = event.target.closest('[data-admin-action]');
    if (!actionButton) return;

    const action = actionButton.dataset.adminAction;
    const tourId = actionButton.dataset.tourId;

    switch (action) {
      case 'toggle-language':
        event.preventDefault();
        toggleAdminLanguage();
        break;

      case 'logout':
        event.preventDefault();
        handleLogout();
        break;

      case 'switch-tab': {
        const tab = actionButton.dataset.adminTab;
        if (!tab) return;
        switchTab(tab, actionButton);
        break;
      }

      case 'open-tour-form':
        event.preventDefault();
        openTourForm();
        break;

      case 'open-review-form':
        event.preventDefault();
        openReviewForm();
        break;

      case 'open-faq-form':
        event.preventDefault();
        openFaqForm();
        break;

      case 'open-image-uploader':
        event.preventDefault();
        imageUploadInput?.click();
        break;

      case 'close-modal':
        closeAdminModal(actionButton.dataset.modalId);
        break;

      case 'copy-image-url': {
        const imageUrl = decodeAdminAttribute(actionButton.dataset.imageUrl);
        if (!imageUrl) return;
        copyImageUrl(imageUrl);
        break;
      }

      case 'delete-image':
        confirmDeleteImage(actionButton.dataset.imageId);
        break;

      case 'edit-tour':
        editTour(tourId);
        break;

      case 'delete-tour':
        confirmDeleteTour(
          actionButton.dataset.tourId,
          decodeAdminAttribute(actionButton.dataset.tourTitle)
        );
        break;

      case 'edit-review':
        editReview(actionButton.dataset.reviewId);
        break;

      case 'delete-review':
        confirmDeleteReview(
          actionButton.dataset.reviewId,
          decodeAdminAttribute(actionButton.dataset.reviewName)
        );
        break;

      case 'edit-faq':
        editFaq(actionButton.dataset.faqId);
        break;

      case 'delete-faq':
        confirmDeleteFaq(actionButton.dataset.faqId);
        break;

      case 'mark-request':
        markRequest(actionButton.dataset.requestId, actionButton.dataset.requestStatus);
        break;

      default:
        break;
    }
  });
}

/* ---- Init ---- */

document.addEventListener('DOMContentLoaded', () => {
  (async () => {
    applyAdminTranslations();
    bindAdminEvents();

    try {
      const settings = await PandaDB.getSettings();
      applyAdminBranding(settings);
    } catch (_) {
      applyAdminBranding({ logoUrl: '' });
    }

    if (PandaDB.isAdminLoggedIn()) {
      await showDashboard();
    }
    lucide.createIcons();
  })();
});
