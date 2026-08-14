/* Renders an individual property detail page from PROPS. Called as renderPropertyPage('mk-central'). */
function renderPropertyPage(id) {
  const p = propById(id);
  if (!p) {
    document.querySelector('main .wrap').innerHTML =
      '<p>Sorry, we couldn\'t find that listing. <a href="' + rootPath('find-a-home.html') + '">Back to all homes &rarr;</a></p>';
    return;
  }

  setTown(p.city ? citySlug(p.city) : null);
  document.title = [p.title, p.city].filter(Boolean).join(", ") + " | ST Properties";
  document.getElementById('bc-title').textContent = p.title;

  /* ---- Gallery ---- */
  const imgs = p.images;
  document.getElementById('gallery').innerHTML = `
    <div class="main-img"><img src="${imgs[0]}" alt="${p.alt}"></div>
    <div class="thumbs">${imgs.slice(1, 3).map(src => `<div class="th"><img src="${src}" alt="${p.alt}"></div>`).join('')}</div>
  `;

  /* ---- Above the fold: name, location, price, availability, CTAs ---- */
  document.getElementById('sidebar').innerHTML = `
    <div class="price-row"><span class="amount${priceOf(p) ? "" : " amount--tbc"}">${priceText(p)}</span>${priceOf(p) ? "<span class=\"per\">pcm</span>" : ""}</div>
    <div class="price-sub">${priceOf(p) ? (p.room ? "Per room, per month" : "Whole property, per month") : "Contact us for current rent"}</div>
    <div class="avail sidebar-avail">${icon('calendar', 14)}${availabilityText(p)}</div>
    <div class="sidebar-included">${p.bills === null ? "Ask us what is included" : (p.bills ? "Bills, Wi-Fi and cleaning included" : "Bills charged separately")}</div>
    <button class="btn btn-black" type="button" data-enquire="${p.id}">Enquire About This Property</button>
    <a class="btn btn-outline" href="https://wa.me/447473434736" data-calendly target="_blank" rel="noopener">${icon('calendar', 18)} Book a Viewing</a>
    <p class="sidebar-note">${icon('verified', 13)} No documents or deposit needed to enquire.</p>
  `;

  /* ---- Main information column ---- */
  // Only render rows we actually know — a blank row is worse than no row.
  const yn = (v, yes, no) => v === null || v === undefined ? null : (v ? yes : no);
  const specRows = [
    ['Address', [p.address, p.postcode].filter(Boolean).join(', ')],
    ['Room type', p.type],
    ['Bedrooms', p.beds ? p.beds + (p.beds > 1 ? ' bedrooms' : ' bedroom') : null],
    ['Bathroom', p.bathroom ? p.bathroom + (p.ensuite ? ' (en-suite)' : '') : null],
    ['Furnishing', yn(p.furnished, 'Fully furnished', 'Unfurnished')],
    ['Bills', yn(p.bills, 'Included in rent', 'Charged separately')],
    ['Wi-Fi', yn(p.wifi, 'Included', 'Not included')],
    ['Parking', yn(p.parking, 'Free off-street parking', 'No parking')],
    ['Cleaning', yn(p.cleaning, 'Professional cleaning included', 'Not included')],
    ['Minimum stay', p.minStay],
    ['Reservation deposit', money(PROPERTY_DEFAULTS.reservationDeposit)],
    ['Availability', availabilityText(p)]
  ].filter(([, v]) => v !== null && v !== undefined && v !== '');

  document.getElementById('info').innerHTML = `
    <div class="chip-row">
      <span class="chip chip-available">Available</span>
      <span class="chip chip-ref">REF ${p.id.toUpperCase()}</span>
    </div>
    ${[p.city, p.type].filter(Boolean).length ? `<span class="eyebrow">${[p.city, p.type].filter(Boolean).join(" · ")}</span>` : ""}
    <h1>${p.title}</h1>
    <div class="detail-meta detail-meta--icon">${icon('location', 15)} ${p.address}</div>

    <div class="rule-labeled">At a glance</div>
    ${specGrid(p)}

    <div class="rule-labeled">About this property</div>
    ${p.description ? `<p class="detail-desc">${p.description}</p>` : `<p class="detail-desc">Full details for this property are available on request — send an enquiry and we will come back to you with rent, room type and availability.</p>`}

    <div class="rule-labeled">Property information</div>
    <div class="spec-table"><dl>
      ${specRows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}
    </dl></div>

    ${(p.bills === true || p.feats.length) ? `<div class="rule-labeled">Features</div>` : ""}
    <div class="detail-feats">${p.bills === true ? "<span class=\"bills\">Bills included</span>" : ""}${p.feats.map(f => `<span>${f}</span>`).join("")}</div>

    <div class="rule-labeled">What's nearby</div>
    <div class="nearby-list">
      <div class="n-item"><span class="ic">🛒</span><span>Supermarkets</span></div>
      <div class="n-item"><span class="ic">🚆</span><span>Transport links</span></div>
      <div class="n-item"><span class="ic">🩺</span><span>GP &amp; pharmacy</span></div>
      <div class="n-item"><span class="ic">🍽️</span><span>Restaurants &amp; cafés</span></div>
      <div class="n-item"><span class="ic">🌳</span><span>Parks &amp; leisure</span></div>
      <div class="n-item"><span class="ic">🏦</span><span>Banks &amp; post office</span></div>
    </div>
    <p class="nearby-links">
      <a href="${mapsLinkUrl(p)}" target="_blank" rel="noopener">Open in Maps &rarr;</a>
      ${p.city ? `&nbsp;·&nbsp; <a href="${rootPath("area-guide.html#" + citySlug(p.city))}">${p.city} area guide &rarr;</a>` : ""}
    </p>

    <div class="rule-labeled">Location</div>
    <div class="map-embed"><iframe src="${mapEmbedUrl(p)}" loading="lazy" title="Map showing the approximate location of ${p.title}"></iframe></div>
  `;

  /* ---- Repeated CTA after the detail content ---- */
  const band = document.getElementById('detail-cta');
  if (band) {
    band.innerHTML = `
      <div class="detail-cta-band">
        <div>
          <h3>Interested in this property?</h3>
          <p>${[priceOf(p) ? money(priceOf(p)) + " pcm" : null, availabilityText(p), "No documents or deposit needed to enquire."].filter(Boolean).join(" · ")}</p>
        </div>
        <button class="btn btn-gold" type="button" data-enquire="${p.id}">Enquire About This Property</button>
      </div>`;
  }

  /* ---- Similar listings (same PropertyCard component as the homepage) ---- */
  const similar = PROPS
    .filter(x => x.id !== p.id)
    .sort((a, b) => (b.city === p.city) - (a.city === p.city))
    .slice(0, 3);
  document.getElementById('similar').innerHTML = similar.map(PropertyCard).join('');
}
