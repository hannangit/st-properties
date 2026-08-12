# ST Properties — website

Static site (no framework, no npm). Serviced rooms and homes to rent, plus a
resident support hub and a landlord guaranteed-rent page.

## Running it locally

Assets and links use **relative paths**, so you can open `index.html` directly
from disk. To view it exactly as it will be served:

```bash
bash serve.sh
```

Then open <http://localhost:8752>.

## Editing content

| What you want to change | Where |
| --- | --- |
| Property listings | `assets/js/properties-data.js` |
| Phone, email, Formspree, booking links | `assets/js/config.js` |
| Header / nav, footer, enquiry modal | `partials/` — then run `bash build.sh` |
| Colours, spacing, components | `assets/css/style.css` |
| Icons | `assets/js/icons.js` |

### Shared header / footer / modal

These live once in `partials/` and are injected into every page by `build.sh`
between `<!-- @header -->` … `<!-- @/header -->` marker comments.

**After editing anything in `partials/`, run:**

```bash
bash build.sh
```

The build is idempotent — re-running is always safe. It also normalises every
internal path, so it is the single place that owns link resolution.

### Deployment paths

```bash
bash build.sh                    # relative paths (default) — works from disk,
                                 # from any server, and in a subfolder
bash build.sh --base=/           # root-relative, for a domain root
bash build.sh --base=/my-repo/   # fixed base, e.g. a GitHub Pages project site
```

If you deploy to GitHub Pages as a *project* site (`user.github.io/repo/`), use
the third form with your repository name, or leave the default relative paths.

## Property data

`assets/js/properties-data.js` holds all 21 properties. Only the street name is
currently filled in — every commercial field is deliberately `null` rather than
invented, and the UI degrades gracefully (price shows "Rent on request",
unknown spec rows are omitted).

To bring a property fully live, populate: `city`, `type`, `beds`, `room` or
`whole`, `bills`, `wifi`, `parking`, `bathroom`, `availableFrom`, `images`,
`description`.

The search filters are hidden until **every** property has the relevant field —
filtering on partial data would silently hide properties whose value is merely
unknown. Fill the data in and the filters reappear on their own.

## Outstanding before go-live

- [ ] Real property photography (all listings share one placeholder image)
- [ ] Property details: rent, room type, bedrooms, city, availability
- [ ] Formspree endpoint in `config.js` (enquiry form currently shows a demo confirmation)
- [ ] Calendly link in `config.js` ("Book a viewing" falls back to WhatsApp)
- [ ] PRS and Client Money Protect registration numbers in `partials/footer.html`
- [ ] Team page: real names, photos and contact details (currently placeholders
      using Ofcom's reserved 07700 900xxx range)
- [ ] Confirm deposit wording — £280 to secure vs. the three-weeks'-rent damage
      deposit in clause 7 of the tenant guidelines
- [ ] Complaints response timeframes (`[X] working days` in `residents/complaints.html`)

## Layout

```
index.html            Home — resident hub entry, room search, landlord banner
how-it-works.html     Booking process, documents, deposit
residents-hub.html    Resident tools and support
area-guide.html       Local information by area
landlords.html        Guaranteed rent
team.html             People
residents/            Tenant guidelines, complaints & redress
properties/           One page per listing (generated from properties-data.js)
partials/             Shared header, footer, enquiry modal
assets/               CSS, JS, icons
```
