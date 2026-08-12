/* Shared site behaviour: navigation, property search, the PropertyCard component,
   the enquiry/landlord modal, area tabs and the entry transition.
   All event listeners are bound here — no inline handlers in the HTML. */

/* ---------- Town mood theming ---------- */
function citySlug(cityName) { return cityName.toLowerCase().replace(/\s+/g, '-'); }
function setTown(slug) {
  if (slug) document.body.setAttribute('data-town', slug);
  else document.body.removeAttribute('data-town');
}

/* ---------- Entry transition ---------- */
function initIntro() {
  const overlay = document.getElementById('intro-loader');
  const root = document.documentElement;
  if (!overlay || !root.classList.contains('intro-active')) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hold = reduce ? 300 : 2000;   // brief says hold 1.8–2.2s
  const fade = reduce ? 0 : 800;      // matches the CSS transition duration

  setTimeout(() => {
    overlay.classList.add('fade-out');
    try { sessionStorage.setItem('introShown', 'true'); } catch (e) { /* private mode */ }
    setTimeout(() => { root.classList.remove('intro-active'); overlay.remove(); }, fade);
  }, hold);
}

/* ---------- Colour theme (Day / Night) ----------
   The default is Day (the brand palette). A page-head script restores the saved
   choice before first paint; this only handles switching and button state. */
function applyTheme(name) {
  const root = document.documentElement;
  if (name === 'night') root.dataset.theme = 'night';
  else delete root.dataset.theme;
  try { localStorage.setItem('st-theme', name); } catch (e) { /* private mode */ }
  document.querySelectorAll('[data-theme-set]').forEach(b => {
    b.setAttribute('aria-pressed', String(b.dataset.themeSet === name));
  });
}
function initTheme() {
  const current = document.documentElement.dataset.theme === 'night' ? 'night' : 'day';
  document.querySelectorAll('[data-theme-set]').forEach(b => {
    b.setAttribute('aria-pressed', String(b.dataset.themeSet === current));
    b.addEventListener('click', () => applyTheme(b.dataset.themeSet));
  });
}

/* ---------- Tabs ----------
   Markup: .tabs > .tablist > button[data-tab="id"] , then .tab-panel[data-panel="id"] */
function initTabs() {
  document.querySelectorAll('.tabs').forEach(group => {
    const btns = [...group.querySelectorAll('[data-tab]')];
    const panels = [...group.querySelectorAll('[data-panel]')];
    if (!btns.length) return;

    const select = key => {
      btns.forEach(b => b.setAttribute('aria-selected', String(b.dataset.tab === key)));
      panels.forEach(p => { p.hidden = p.dataset.panel !== key; });
    };
    btns.forEach((b, i) => {
      b.addEventListener('click', () => select(b.dataset.tab));
      b.addEventListener('keydown', e => {
        const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!dir) return;
        e.preventDefault();
        const next = btns[(i + dir + btns.length) % btns.length];
        next.focus(); select(next.dataset.tab);
      });
    });
    select(btns[0].dataset.tab);
  });
}

/* ---------- Navigation ---------- */
function toggleMenu() {
  const m = document.getElementById('mmenu');
  const burger = document.querySelector('.burger');
  if (!m) return;
  const open = m.style.display === 'flex';
  m.style.display = open ? 'none' : 'flex';
  if (burger) burger.setAttribute('aria-expanded', String(!open));
}
function closeAllDropdowns() {
  document.querySelectorAll('.nav-item.open').forEach(i => {
    i.classList.remove('open');
    const b = i.querySelector('.nav-toggle');
    if (b) b.setAttribute('aria-expanded', 'false');
  });
}
function initNav() {
  document.querySelectorAll('.nav-item .nav-toggle').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const item = btn.closest('.nav-item');
      const wasOpen = item.classList.contains('open');
      closeAllDropdowns();
      if (!wasOpen) { item.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); }
    });
  });
  document.addEventListener('click', closeAllDropdowns);
}

/* ---------- Inline SVG icon injection (replaces per-page inline scripts) ---------- */
function initIcons() {
  document.querySelectorAll('[data-icon]').forEach(el => {
    if (el.dataset.iconDone) return;
    el.innerHTML = icon(el.dataset.icon, +el.dataset.iconSize || undefined);
    el.dataset.iconDone = '1';
  });
}

/* ---------- PropertyCard — the single card component used everywhere ---------- */
function PropertyCard(p) {
  const href = rootPath('properties/' + p.id + '.html');

  // Only state what we actually know about a property.
  const metaBits = [
    p.type,
    p.beds ? p.beds + ' bedroom' + (p.beds > 1 ? 's' : '') : null,
    p.bathroom ? p.bathroom.toLowerCase() + ' bathroom' : null
  ].filter(Boolean);

  const amenities = [
    { on: p.bills, label: 'Bills included' },
    { on: p.wifi, label: 'Wi-Fi' },
    { on: p.furnished, label: 'Furnished' },
    { on: p.parking, label: 'Parking' }
  ].filter(a => a.on !== null && a.on !== undefined);

  const price = priceOf(p);

  return `<article class="prop">
    <a href="${href}" tabindex="-1" aria-hidden="true">
      <div class="ph">
        <img src="${p.images[0]}" alt="${p.alt}" loading="lazy">
        ${p.type ? `<span class="roomtype">${p.type}</span>` : ''}
      </div>
    </a>
    <div class="body">
      ${p.city ? `<div class="prop-loc">${icon('location', 13)}${p.city}</div>` : ''}
      <h4><a href="${href}">${p.title}</a></h4>
      <div class="meta">${metaBits.length ? metaBits.join(' · ') : p.address}</div>
      <div class="price-row">
        <span class="amount${price ? '' : ' amount--tbc'}">${priceText(p)}</span>
        ${price ? '<span class="per">pcm</span>' : ''}
      </div>
      <div class="price-sub">${price ? (p.room ? 'Per room, per month' : 'Whole property, per month') : 'Contact us for current rent'}</div>
      <div class="avail">${icon('calendar', 14)}${availabilityText(p)}</div>
      ${amenities.length ? `<ul class="amenity-list">
        ${amenities.map(a => `<li class="${a.on ? '' : 'off'}">${a.label}</li>`).join('')}
      </ul>` : ''}
      <div class="actions">
        <a class="btn btn-black" href="${href}">View Property</a>
        <button class="btn btn-outline" type="button" data-enquire="${p.id}">Enquire</button>
      </div>
    </div>
  </article>`;
}

/* ---------- Property search ---------- */
function renderGrid(list) {
  const g = document.getElementById('grid');
  if (!g) return;
  const count = document.getElementById('count');
  if (count) count.textContent = list.length + (list.length === 1 ? ' home' : ' homes') + ' available';

  if (!list.length) {
    g.innerHTML = `<div class="noresults">
      <h3>No homes match your current filters.</h3>
      <p>Try widening your search, or clear the filters to see everything available.</p>
      <button class="btn btn-black" type="button" data-action="clear-filters">Clear filters</button>
    </div>`;
    return;
  }
  g.innerHTML = list.map(PropertyCard).join('');
}
function filterValue(id) { const el = document.getElementById(id); return el ? el.value : ''; }
function applyFilters() {
  const city = filterValue('f-city');
  const type = filterValue('f-type');
  const price = +(filterValue('f-price') || 99999);
  const beds = +(filterValue('f-beds') || 0);
  renderGrid(PROPS.filter(p => {
    if (city && p.city !== city) return false;
    if (type && p.type !== type) return false;
    if (priceOf(p) !== null && priceOf(p) > price) return false;
    if (beds && (p.beds === null || p.beds < beds)) return false;
    return true;
  }));
  setTown(city ? citySlug(city) : null);
}
function clearFilters() {
  document.getElementById('f-city').value = '';
  document.getElementById('f-type').value = '';
  document.getElementById('f-price').value = '99999';
  document.getElementById('f-beds').value = '0';
  applyFilters();
}
function initSearch() {
  const grid = document.getElementById('grid');
  if (!grid) return;

  // A filter with no data behind it can only ever return nothing, so hide it
  // until the corresponding fields are populated in properties-data.js.
  const filterFields = { 'f-city': 'city', 'f-type': 'type', 'f-price': 'room', 'f-beds': 'beds' };
  let visibleFilters = 0;
  Object.entries(filterFields).forEach(([id, field]) => {
    const el = document.getElementById(id);
    if (!el) return;
    const usable = field === 'room'
      ? PROPS.every(p => priceOf(p) !== null)
      : hasFilterableData(field);
    const group = el.closest('.control-group');
    if (group) group.hidden = !usable;
    if (usable) visibleFilters++;
  });

  const bar = document.querySelector('.searchbar');
  if (bar) bar.hidden = visibleFilters === 0;
  const note = document.getElementById('search-note');
  if (note) note.hidden = visibleFilters !== 0;

  document.querySelectorAll('[data-filter]').forEach(el => el.addEventListener('change', applyFilters));
  const searchBtn = document.querySelector('[data-action="search"]');
  if (searchBtn) searchBtn.addEventListener('click', applyFilters);
  renderGrid(PROPS);
}

/* ---------- Modal: enquiry (tenant) and property registration (landlord) ---------- */
let lastFocusedEl = null;

function modalEl() { return document.getElementById('modal'); }
function focusableInModal() {
  return [...modalEl().querySelectorAll('a[href], button:not([disabled]), input, textarea, select')]
    .filter(el => el.offsetParent !== null);
}
function openModal() {
  const m = modalEl();
  lastFocusedEl = document.activeElement;
  m.hidden = false;
  m.classList.add('show');
  document.body.style.overflow = 'hidden';
  const first = focusableInModal().find(el => el.id !== 'm-close') || document.getElementById('m-close');
  if (first) first.focus();
}
function closeModal() {
  const m = modalEl();
  m.classList.remove('show');
  m.hidden = true;
  document.body.style.overflow = '';
  if (lastFocusedEl) { lastFocusedEl.focus(); lastFocusedEl = null; }
}

/* Show only the fields relevant to the current audience. */
function setModalAudience(kind) {
  document.querySelectorAll('#m-form [data-audience]').forEach(el => {
    el.hidden = el.getAttribute('data-audience') !== kind;
  });
  const isLL = kind === 'landlord';
  document.getElementById('m-submit').textContent = isLL ? 'Register my property' : 'Send enquiry';
  document.getElementById('m-message-label').innerHTML = isLL
    ? 'Anything else about the property? <span class="opt">(optional)</span>'
    : 'Message <span class="opt">(optional)</span>';
  document.getElementById('m-message').placeholder = isLL
    ? 'Current condition, tenancy situation, what you\'re looking for…'
    : 'Anything you\'d like us to know?';
  document.getElementById('m-note').innerHTML = isLL
    ? '<b>No obligation and no agency fees.</b><br>We\'ll review your property and come back with an offer.'
    : '<b>No documents or deposit needed to enquire.</b><br>We\'ll contact you about viewing availability and next steps.';
}
function resetModalForm(kind) {
  document.getElementById('m-form').style.display = 'block';
  document.getElementById('m-success').style.display = 'none';
  const err = document.getElementById('m-error');
  err.style.display = 'none';
  err.textContent = '';
  document.querySelectorAll('#m-form .field').forEach(f => f.classList.remove('invalid'));
  document.getElementById('m-submit').disabled = false;
  setModalAudience(kind);
}
function openEnquiry(id) {
  const p = propById(id);
  document.getElementById('m-title').textContent = 'Enquire about ' + p.title;
  document.getElementById('m-sub').textContent = [
    p.city,
    priceOf(p) ? money(priceOf(p)) + ' pcm' : null,
    availabilityText(p)
  ].filter(Boolean).join(' · ');
  document.getElementById('m-property').value = p.id;
  resetModalForm('tenant');
  const d = new Date(); d.setDate(d.getDate() + 7);
  const dateEl = document.getElementById('m-date');
  dateEl.min = new Date().toISOString().split('T')[0];
  dateEl.value = (p.availableFrom && p.availableFrom > dateEl.min) ? p.availableFrom : d.toISOString().split('T')[0];
  openModal();
}
function openLL() {
  document.getElementById('m-title').textContent = 'Register your property';
  document.getElementById('m-sub').textContent = 'Guaranteed rent · no voids · no agency fees · full management';
  document.getElementById('m-property').value = 'landlord-enquiry';
  resetModalForm('landlord');
  const availEl = document.getElementById('m-available');
  if (availEl) availEl.min = new Date().toISOString().split('T')[0];
  openModal();
}

function setFieldError(inputId, message) {
  const input = document.getElementById(inputId);
  const field = input.closest('.field');
  const errEl = document.getElementById(inputId + '-err');
  if (message) {
    field.classList.add('invalid');
    input.setAttribute('aria-invalid', 'true');
    if (errEl) errEl.textContent = message;
  } else {
    field.classList.remove('invalid');
    input.removeAttribute('aria-invalid');
    if (errEl) errEl.textContent = '';
  }
  return !message;
}
function validateEnquiry(isLL) {
  const name = document.getElementById('m-fname').value.trim();
  const email = document.getElementById('m-email').value.trim();
  let ok = setFieldError('m-fname', name ? '' : 'Please enter your first name.');

  let emailMsg = '';
  if (!email) emailMsg = 'Please enter your email address.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) emailMsg = 'Please enter a valid email address, like jane@example.com.';
  ok = setFieldError('m-email', emailMsg) && ok;

  if (isLL) {
    const addr = document.getElementById('m-address').value.trim();
    ok = setFieldError('m-address', addr ? '' : 'Please enter the property address so we know what we\'re assessing.') && ok;
  }
  return ok;
}

async function submitEnquiry(e) {
  if (e) e.preventDefault();
  const propertyId = document.getElementById('m-property').value;
  const isLL = propertyId === 'landlord-enquiry';
  const btn = document.getElementById('m-submit');
  const err = document.getElementById('m-error');
  err.style.display = 'none';

  if (!validateEnquiry(isLL)) {
    const firstInvalid = document.querySelector('#m-form .field.invalid input');
    if (firstInvalid) firstInvalid.focus();
    return;
  }

  const payload = {
    enquiryType: isLL ? 'Landlord property registration' : 'Room enquiry',
    property: propertyId,
    firstName: document.getElementById('m-fname').value,
    lastName: document.getElementById('m-lname').value,
    email: document.getElementById('m-email').value,
    phone: document.getElementById('m-phone').value,
    message: document.getElementById('m-message').value
  };
  if (isLL) {
    payload.propertyAddress = document.getElementById('m-address').value;
    payload.bedrooms = document.getElementById('m-bedrooms').value;
    payload.propertyAvailableFrom = document.getElementById('m-available').value;
  } else {
    payload.moveInDate = document.getElementById('m-date').value;
  }

  if (!CONFIG.formspreeEndpoint || CONFIG.formspreeEndpoint.includes('YOUR_FORM_ID')) {
    showSuccess(isLL); // no live backend configured yet
    return;
  }

  const original = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Sending…';
  try {
    const res = await fetch(CONFIG.formspreeEndpoint, {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Form submission failed');
    showSuccess(isLL);
  } catch (_) {
    err.innerHTML = 'Something went wrong sending that. Please try again, or contact us on <a href="https://wa.me/447473434736" target="_blank" rel="noopener">WhatsApp</a>.';
    err.style.display = 'block';
    btn.disabled = false;
    btn.textContent = original;
  }
}
function showSuccess(isLL) {
  document.getElementById('m-form').style.display = 'none';
  document.getElementById('m-success').style.display = 'block';
  document.getElementById('m-success-title').textContent = isLL ? 'Property registered' : 'Enquiry sent';
  document.getElementById('m-success-txt').textContent = isLL
    ? 'Thanks — your property details are on their way to us.'
    : 'Thanks — your enquiry for this property is on its way.';
  document.getElementById('m-success-next').innerHTML = isLL
    ? 'We\'ll review the property and come back to you with a guaranteed-rent offer and proposed terms.'
    : 'We\'ll be in touch shortly. Documents and deposit come <b>after</b> you\'ve viewed and reserved.';
  const cta = document.getElementById('m-success-cta');
  cta.textContent = isLL ? 'Read about Guaranteed Rent →' : 'See how booking works →';
  cta.href = rootPath(isLL ? 'landlords.html' : 'how-it-works.html');
  document.getElementById('m-close').focus();
}

/* ---------- Area guide tabs ---------- */
const AREA_TOWN_SLUGS = { mk: 'milton-keynes', nn: 'northampton', lu: 'luton', cov: 'coventry' };
function area(key, btn) {
  document.querySelectorAll('.area-panel').forEach(x => x.classList.remove('active'));
  document.querySelectorAll('.area-tab').forEach(x => { x.classList.remove('active'); x.setAttribute('aria-selected', 'false'); });
  document.getElementById('area-' + key).classList.add('active');
  btn.classList.add('active');
  btn.setAttribute('aria-selected', 'true');
  setTown(AREA_TOWN_SLUGS[key]);
}
function initAreaTabs() {
  const tabs = [...document.querySelectorAll('.area-tab')];
  if (!tabs.length) return;
  tabs.forEach(btn => btn.addEventListener('click', () => area(btn.dataset.area, btn)));

  // Honour a #town hash so links elsewhere can open a specific area.
  const slug = decodeURIComponent(location.hash.replace('#', ''));
  const wantedKey = Object.keys(AREA_TOWN_SLUGS).find(k => AREA_TOWN_SLUGS[k] === slug);
  const wantedTab = wantedKey && tabs.find(b => b.dataset.area === wantedKey);
  if (wantedTab) area(wantedKey, wantedTab);
  else {
    const activePanel = document.querySelector('.area-panel.active');
    if (activePanel) setTown(AREA_TOWN_SLUGS[activePanel.id.replace('area-', '')]);
  }
}

/* ---------- Page init ---------- */
document.addEventListener('DOMContentLoaded', () => {
  initIntro();
  initTheme();
  initNav();
  initIcons();
  initTabs();
  initSearch();
  initAreaTabs();

  // Global click delegation for declarative actions
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-action], [data-enquire]');
    if (!t) return;
    if (t.dataset.enquire) { openEnquiry(t.dataset.enquire); return; }
    switch (t.dataset.action) {
      case 'toggle-menu':    toggleMenu(); break;
      case 'clear-filters':  clearFilters(); break;
      case 'open-landlord':  openLL(); break;
    }
  });

  // Property detail pages declare their listing on <body data-property="...">
  const pid = document.body.dataset.property;
  if (pid && typeof renderPropertyPage === 'function') renderPropertyPage(pid);

  // Modal wiring (markup injected on every page by build.sh)
  const m = modalEl();
  if (m) {
    m.addEventListener('click', e => { if (e.target === m) closeModal(); });
    document.getElementById('m-close').addEventListener('click', closeModal);
    document.getElementById('m-form').addEventListener('submit', submitEnquiry);
    document.addEventListener('keydown', e => {
      if (m.hidden) return;
      if (e.key === 'Escape') { closeModal(); return; }
      if (e.key !== 'Tab') return;
      const f = focusableInModal();
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }

  // CONFIG-driven links (each already has a working WhatsApp fallback href)
  document.querySelectorAll('[data-calendly]').forEach(el => { if (CONFIG.calendlyUrl) el.href = CONFIG.calendlyUrl; });
  document.querySelectorAll('[data-maintenance]').forEach(el => { if (CONFIG.maintenanceFormUrl) el.href = CONFIG.maintenanceFormUrl; });
  document.querySelectorAll('[data-complaints]').forEach(el => { if (CONFIG.complaintsFormUrl) el.href = CONFIG.complaintsFormUrl; });
});
