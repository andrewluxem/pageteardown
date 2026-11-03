# Content contract

This is the interface between the scoring pipeline and the site. The exporter
writes one Markdown file with YAML frontmatter per night into
`src/content/scoreboard/`; the site reads it at build time. The Zod schemas in
`src/lib/schemas.ts` enforce every rule below, and `src/lib/boards.ts` the
rules across files, so a malformed file fails `npm run build`.

The rubric behind every score is `docs/rubric/page-teardown-rubric-v1-2026-10-31.md`.
Dimension questions and anchors live only there; the methodology page reads them.

## Board: `src/content/scoreboard/YYYY-MM-DD.md`

One file per night. The filename must equal `date`. `date` is the night the
homepages were captured (the Mountain Time calendar date of the capture run).
The nightly publisher may change only this folder (`.github/workflows/auto-pr-scope.yml`).

```yaml
---
date: 2026-11-02                    # YYYY-MM-DD, must match the filename
generated_at: 2026-11-03T13:00:00Z  # ISO 8601 timestamp
rubric_version: "1.0-draft"         # quote it, or YAML reads it as a number
pages:                              # at least one
  - id: 2026-11-02-kestrel-outdoor-home   # <date>-<brand_slug>-home; unique across ALL files
    brand: Kestrel Outdoor
    brand_slug: kestrel-outdoor        # a-z, 0-9, hyphens; the registry slug; groups nights into brand pages
    vertical: outdoor                  # see Verticals
    homepage_kind: storefront          # storefront | product | editorial | other
    url: https://www.kestrel.example/  # the homepage captured, https; shown as text, never linked
    captured_at: 2026-11-03T04:20:00Z  # ISO 8601
    hero_headline: "Gear for the first snow"   # or null when the headline is baked into an image
    hero_subhead: "Free returns all winter"    # optional
    primary_cta: { text: "Shop winter", href: "/collections/winter" }   # href optional; null when no CTA is in the first screen
    dimensions:                        # all 8 required, no extras
      headline:  { score: 4, note: "...", source: judgment }
      value:     { score: 3, note: "...", source: judgment }
      hierarchy: { score: 2, note: "...", source: both }
      copy:      { score: 4, note: "...", source: judgment }
      cta:       { score: 4, note: "...", source: judgment }
      relevance: { score: 3, note: "...", source: judgment }
      trust:     { score: 4, note: "...", source: judgment }
      hygiene:   { score: 1, note: "...", source: check }
    checks:                            # optional, defaults to []
      - { name: Main button link, result: fail, detail: "/collections/winter returns HTTP 404 on two attempts" }
      - { name: Other links, result: unverified, detail: "HTTP 403 on two attempts" }
      - { name: Page load, result: pass }
    screenshot: null                   # or https://jvx7f1mxqao2jbqs.public.blob.vercel-storage.com/... (or "/shots/<file>" for fixtures)
    correction:                        # optional; set when a published score changes
      date: 2026-11-04
      note: "Technical hygiene raised from 1 to 3: the link resolved on a recheck the same night."
not_captured:                       # optional, defaults to []
  - brand: Ostra Coffee Co.
    brand_slug: ostra-coffee-co
    vertical: food
    reason: "The site blocked our capture browser."
---
```

Rules:

- `score` is an integer from 1 to 5. `note` is a non-empty string: the one line
  of evidence the rubric requires (a quote from the visible page text, what is
  visible in the screenshot, or the deciding check's output). `source` is
  `check` when a check ceiling set the score, `judgment` when the judge did,
  `both` when the judge scored at a ceiling a check set.
- `id` must be exactly `<date>-<brand_slug>-home`, so a brand has at most one
  page per night and the page type is in the URL from the start.
- `hero_headline` must be present. It is the headline as live text, or `null`
  when the headline is part of an image (the board shows "Headline is in an
  image").
- `checks[].name` is one of the public names in `src/lib/checks.ts`, never a
  scorer `check_id` (see the mapping below). `result` is `pass`, `fail`, or
  `unverified` (shown as "Not verified"; Rubric v1 never lowers a score for it);
  `detail` is optional.
- `screenshot` is `null`, a path under `/shots/`, or an `https://` URL whose
  host is exactly `jvx7f1mxqao2jbqs.public.blob.vercel-storage.com`, the
  public Blob store `pageteardown-shots` (no credentials, port or empty path).
  Any other URL fails the build, including one from another Blob store: the
  CSP's `img-src` allows only this host, so it would show as a broken image.
  Real screenshots live in that store and are referenced by URL, never
  committed. The capture is the 375x667 phone viewport at 2x (750x1334) or 3x
  (1125x2001).
- `correction` is optional. When present, the scorecard shows "Corrected
  {date}: {note}" in the verdict block. Update the dimension scores themselves
  to the corrected values.
- Unknown keys anywhere in a night, page, dimension, check or not-captured
  entry fail the build.

### Not captured

A brand on the panel with no published page that night goes in
`not_captured` with a `reason` in public wording: a sentence that starts with
a capital letter and ends with a period, at least three words, no underscores
("The site blocked our capture browser.", "The homepage did not finish loading
in time."). Never an internal code such as `bot_wall` or `HTTP_403`.

A `brand_slug` may not appear in both `pages` and `not_captured` on the same
night, or twice in `not_captured`.

### Hard-fail evidence gate (standing rule)

A score of 1 on `trust` or `hygiene` caps the page publicly. The build rejects
any such score unless the page has at least one check with `result: fail` and
a non-empty `detail`. An `unverified` check does not count.

The schema can only confirm that evidence is present, not that it is correct.
Any pipeline change that adds or alters a path that can force a 1 must have its
output reviewed against raw evidence (status codes, headers, HTML, the
screenshot) before that output goes into a PR. Inbox Teardown's Oct 7 board is
the precedent: 17 of 19 sends hard-failed on checks the evidence did not confirm.

### Dimensions

Keys are the rubric's slugs, in the order a first-time visitor meets them.
Display names come from `src/config/rubric.ts` and may change; keys may not.

| key | Display name |
|---|---|
| `headline` | Headline |
| `value` | Value & differentiation |
| `hierarchy` | Design & hierarchy |
| `copy` | Copy & voice |
| `cta` | Call to action |
| `relevance` | Relevance |
| `trust` | Trust |
| `hygiene` | Technical hygiene |

### Verticals

Keys from `src/config/verticals.ts`. Labels are the `vertical` values of the
brand registry (email-scoreboard `data/brands.json`); the exporter maps a
registry label to its key (`VERTICAL_KEY_FOR_LABEL`).

| key | label (registry `vertical`) |
|---|---|
| `apparel` | Apparel & footwear |
| `beauty` | Beauty & personal care |
| `home` | Home & furnishings |
| `outdoor` | Outdoor & sporting goods |
| `dept` | Department & mass |
| `jewelry` | Jewelry |
| `food` | Food & meal kits |
| `other` | Other |

### Homepage kinds

The rubric's Choice question for kind. It routes and filters the board and is
never scored.

| key | label |
|---|---|
| `storefront` | Storefront |
| `product` | Product-led |
| `editorial` | Editorial |
| `other` | Other |

### Derived, never stored

Computed in `src/lib/scoring.ts`. Do not write these into content.

- `total`: the sum of the 8 dimension scores, 8 to 40.
- `capped`: true when `trust.score` or `hygiene.score` is 1.
- `band`: `capped` if capped, otherwise `strong` (33 to 40), `solid` (24 to
  32), or `weak` (under 24).
- Board order: uncapped pages by total descending, then capped pages by total
  descending; ties by brand, then id.
- Best and worst: over every captured page. Best is the top uncapped page;
  worst is the first capped page, or, with nothing capped, the lowest uncapped
  page.

### Brand pages

Derived by grouping every night's pages by `brand_slug`; there is no brand
collection. A brand is published from its first scored night. Its page shows
the 30 nights ending on the newest board: "N of 30 nights" scored, a filmstrip
of nights linking to each scorecard, nights in `not_captured` as gaps with
their reason, and the latest scorecard. A brand's name and vertical come from
its most recent scored night.

## Fixtures: `tests/fixtures/scoreboard/`

Three fixture nights with placeholder brands "Brand A (placeholder)" to "Brand
T (placeholder)", `.example` homepage URLs and the PLACEHOLDER screenshots in
`public/shots/fixtures/`. The collection loads them instead of
`src/content/scoreboard/` only for `npm run dev:fixtures` (`PT_FIXTURES=1`) and
Vercel preview builds (`VERCEL_ENV=preview`; `PT_FIXTURES=0` turns them off
there). A Vercel production build never loads them, and fails if
`PT_FIXTURES=1` is set (`src/config/board.ts`). Fixture builds show a banner
on every page, and prelaunch fails any build that carries fixture content.

Never use a real brand name in a fixture.

## From page-scoreboard records

The rubric's content contract has the agent host emit one record per homepage.
This is how a record becomes a page on the board. As of Oct 31,
page-scoreboard (main, codebook `1.0-draft.7`) has no exporter yet, and its
codebook's eight dimensions (`value_proposition`, `primary_message`,
`hierarchy`, `primary_cta`, `findability`, `trust`, `interruption`,
`performance`) are not the rubric's. The rubric's eight slugs below are what
the board accepts; scores keyed by the codebook's dimensions cannot be
published until the scorer emits rubric v1 slugs.

| Record field | Board field |
|---|---|
| brand (registry `name`) | `brand` |
| brand slug (registry key) | `brand_slug` |
| registry `vertical` | `vertical`, through `VERTICAL_KEY_FOR_LABEL` |
| registry `pages[type=home].url` | `url` |
| capture date | the file's `date`, and the `id` prefix |
| capture timestamp | `captured_at` |
| homepage kind (the Choice answer) | `homepage_kind` |
| dimension score, by rubric slug | `dimensions.<slug>.score` |
| the dimension's evidence line | `dimensions.<slug>.note` |
| the dimension's ceiling-setting check | `dimensions.<slug>.source`: `check` when the ceiling is below the judged score, `both` when equal, `judgment` when there is none or it is above |
| check results, by `check_id` | `checks[]`: `name` from `CHECK_PUBLIC_NAMES`, `result` from the status, `detail` from the evidence |
| `rubric_version` | `rubric_version` |
| screenshot URL in the public store | `screenshot` |
| visible hero headline, subhead and primary CTA text and href | `hero_headline` (`null` when image-only), `hero_subhead`, `primary_cta` |

What is published:

- A record with any unscored dimension (page-scoreboard's `complete: false`,
  for example an `incomplete` or `no_field_data` dimension, or an `unjudged`
  check) or with pending check review (`pending_check_review: true`) is not
  published. The brand goes in `not_captured` with a public reason.
- Check status `pass` and `fail` map to themselves. A rubric v1 "unverified"
  outcome (403, 429, timeouts, a footer rendered as an image) maps to
  `unverified`. `not_applicable` is left out. A check whose `check_id` has no
  public name is left out until it gets one.

### Public check names

`CHECK_PUBLIC_NAMES` in `src/lib/checks.ts` names these homepage checks of
codebook `1.0-draft.7`:

| check_id | Public name |
|---|---|
| `hp_val_clear_category` | Product category in view |
| `hp_val_h1_present` | Page heading |
| `hp_msg_hero_headline` | Live hero text |
| `hp_msg_commercial_intent` | Hero offer |
| `hp_hier_h1_in_fold` | Heading in first screen |
| `hp_hier_small_text_share` | Text size |
| `hp_hier_focal_point` | Single focal point |
| `hp_cta_present` | Main button in first screen |
| `hp_cta_action_verb` | Main button label |
| `hp_find_search_present` | Search in first screen |
| `hp_find_nav_present` | Menu button |
| `hp_find_search_open_input` | Open search box |
| `hp_trust_https_valid` | HTTPS certificate |
| `hp_trust_no_failed_images` | Image loading |
| `hp_trust_logo_visible` | Logo in header |
| `hp_intr_no_full_overlay` | Overlay size |
| `hp_intr_unobstructed_fold` | First screen unobstructed |
| `hp_perf_http_ok` | Page load |

Ids with no public name, so their results are not published:

- `hp_intr_no_app_banner`: it passes when there is no app-install banner, so
  any name for the thing it looks at ("App install banner") reads wrong next
  to PASS.
- `hp_perf_lcp_good`, `hp_perf_cls_good`, `hp_perf_inp_good`: origin-level
  CrUX field data. Rubric v1's checks table marks load time "Report only", a
  performance signal "not a craft-quality signal on this board".
- The v0 seed checks in `scoring/checks_a.py` that the v1 codebook does not
  list (`h1_present`, `search_in_fold`, `viewport_meta`, `horizontal_overflow`,
  `cta_tap_target`, `cls_mobile`).

Rubric v1's deterministic checks table has rows with no `check_id` in
page-scoreboard yet. Their public names are in `RUBRIC_CHECK_NAMES` and move
into `CHECK_PUBLIC_NAMES` under their ids once the scorer has them: Page load,
Main button link, Headline matches landing page, Contact, help or terms link,
Other links, Live hero text, Image alt text, Phone width, Key copy
unobstructed, Typos, Offer terms, Link domains.

## Pages: `src/content/pages/*.md`

`privacy.md`. Frontmatter: `title`, `description`. The body may use
`{contactEmail}` (rendered as a mailto link) and `{emailProvider}` (the
provider name, or `[EMAIL PROVIDER]` while unset); both are filled from
`src/config/site.ts` at build.

## Cross-file checks

These run during the build (`src/lib/boards.ts`, called from
`src/lib/content.ts`) and fail it with a message naming the files:

- A board filename that does not match its `date`.
- A page `id` that appears in more than one file.
