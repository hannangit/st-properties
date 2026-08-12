/* Single source of truth for property listings.
   Used by the listings grid, property detail pages, and the enquiry modal.

   ─────────────────────────────────────────────────────────────────────────────
   STATUS: real addresses, details pending.
   These 21 properties are the real portfolio. Only the name and address are
   confirmed, so every commercial field below is deliberately null — nothing is
   invented. The UI degrades gracefully: unknown price shows "Enquire", and
   unknown spec rows are omitted from the property page rather than guessed.

   To bring a property fully live, fill in:
     city         'Milton Keynes' | 'Coventry' | …   (drives the Location filter)
     type         'Single' | 'Double' | 'En-suite' | 'Whole home'
     beds         number
     room         monthly rent per room, or null
     whole        monthly rent for the whole property, or null
     bills/wifi/parking   true | false
     bathroom     'Shared' | 'Private'
     availableFrom  null for "available now", or 'YYYY-MM-DD'
     images       real photographs
     description  a short paragraph
   ───────────────────────────────────────────────────────────────────────────── */

const PROPERTY_DEFAULTS = {
  furnished: true,          // every listing is advertised as fully furnished
  cleaning: true,           // professional cleaning included
  minStay: "3 months",      // PLACEHOLDER — confirm real minimum term
  reservationDeposit: 280   // deposit to secure: three weeks' rent or £280
};

/* Neutral placeholder until real photography is supplied. */
const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=75&auto=format&fit=crop';

function property(id, name, address, overrides) {
  return Object.assign({
    id, name, title: name, address,
    city: null, type: null, beds: null,
    room: null, whole: null,
    bills: null, wifi: null, parking: null,
    bathroom: null, ensuite: false,
    availableFrom: null,
    postcode: null,
    description: null,
    feats: [],
    images: [PLACEHOLDER_IMAGE],
    alt: name
  }, overrides || {});
}

/* House numbers are deliberately omitted from names, addresses and URLs —
   the street is public-facing, the exact door number is not. Flat designations
   are kept only where they are needed to tell two listings on the same street
   apart, and are meaningless without the house number. */
const PROPS = [
  property('st-edmunds-flat-3',  'St Edmunds, Flat 3',  'St Edmunds'),
  property('valais-grove',       'Valais Grove',        'Valais Grove'),
  property('barrington-mews',    'Barrington Mews',     'Barrington Mews'),
  property('darwin',             'Darwin',              'Darwin'),
  property('st-edmunds-flat-1',  'St Edmunds, Flat 1',  'St Edmunds'),
  property('southville',         'Southville',          'Southville'),
  property('longhorn-drive',     'Longhorn Drive',      'Longhorn Drive'),
  property('stratford-road',     'Stratford Road',      'Stratford Road'),
  property('boycott',            'Boycott',             'Boycott'),
  property('matthau-lane',       'Matthau Lane',        'Matthau Lane'),
  property('crosslands',         'Crosslands',          'Crosslands'),
  property('st-edmunds',         'St Edmunds',          'St Edmunds'),
  property('chardacre',          'Chardacre',           'Chardacre'),
  property('stoney-stanton',     'Stoney Stanton',      'Stoney Stanton'),
  property('westfield-road',     'Westfield Road',      'Westfield Road'),
  property('matthau',            'Matthau',             'Matthau'),
  property('albany',             'Albany',              'Albany'),
  property('percheron-place',    'Percheron Place',     'Percheron Place'),
  property('hayton-way',         'Hayton Way',          'Hayton Way'),
  property('haydock-close',      'Haydock Close',       'Haydock Close'),
  property('tenor-close',        'Tenor Close',         'Tenor Close')
];

function money(n) { return '£' + n.toLocaleString(); }
function propById(id) { return PROPS.find(p => p.id === id); }
function mapEmbedUrl(p) { return 'https://www.google.com/maps?q=' + encodeURIComponent([p.address, p.postcode, p.city].filter(Boolean).join(' ')) + '&output=embed'; }
function mapsLinkUrl(p) { return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent([p.address, p.postcode, p.city].filter(Boolean).join(' ')); }

/* Availability, expressed the same way everywhere it appears.
   Wording deliberately avoids the word "Enquire" so it doesn't compete with the
   Enquire button on the card. */
function availabilityText(p) {
  if (!p.availableFrom) return 'Availability on request';
  const d = new Date(p.availableFrom + 'T00:00:00');
  if (isNaN(d)) return 'Availability on request';
  return 'Available from ' + d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
}
function propValue(p, key) { return p[key] !== undefined && p[key] !== null ? p[key] : PROPERTY_DEFAULTS[key]; }
function priceOf(p) { return p.room || p.whole || null; }
function priceText(p) { return priceOf(p) ? money(priceOf(p)) : 'Rent on request'; }

/* A filter is only shown once EVERY property has that field. Filtering on a
   partially-populated field would silently hide properties whose value is
   merely unknown, which reads to the visitor as "we don't have one". */
function hasFilterableData(field) { return PROPS.every(p => p[field] !== null && p[field] !== undefined); }

/* Base path for links built in JavaScript. */
const SITE_BASE = (function () {
  const el = document.querySelector('link[rel="stylesheet"][href*="assets/css/style.css"]');
  const href = el ? el.getAttribute('href') : '';
  return href.replace(/assets\/css\/style\.css.*$/, '');
})();
function rootPath(rel) { return SITE_BASE + rel; }

function specCell(label, value, on, iconName) {
  return `<div class="spec-cell"><span class="spec-label">${icon(iconName, 14)}${label}</span><span class="spec-value${on ? ' on' : ''}">${value}</span></div>`;
}
function specGrid(p) {
  const yn = v => v === null || v === undefined ? '—' : (v ? 'Included' : 'No');
  return `<div class="spec-grid">
    ${specCell('Bills', p.bills === null ? '—' : (p.bills ? 'Included' : 'Extra'), p.bills === true, 'bills')}
    ${specCell('Bathroom', p.bathroom || '—', false, 'bathroom')}
    ${specCell('Parking', p.parking === null ? '—' : (p.parking ? 'Free' : 'None'), p.parking === true, 'parking')}
    ${specCell('Wi-Fi', yn(p.wifi), p.wifi === true, 'wifi')}
  </div>`;
}
