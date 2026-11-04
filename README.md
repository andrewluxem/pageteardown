# Page Teardown

The public site for [pageteardown.com](https://www.pageteardown.com): a nightly board of retail
homepages, scored on a phone, above the fold, on a public rubric. Until the first real board file
lands in `src/content/scoreboard/`, `/` is the "launching soon" holding page and the board's pages
are not built, so production shows only the holding page, the Watchlist waitlist, privacy and a 404.

Seeded from socialteardown (itself seeded from the sibling email teardown site), so the stack, tokens and
checks match it. See "Seeded from the email site" below for what is now page-shaped.

Static Astro site. No client framework. Every page reads fine with JavaScript off.

## Brand

Brand files are in `src/assets/brand/` (see `BRAND.md` there, copied from the page-scoreboard
brand pack): Barlow Condensed ExtraBold 800 (license in `BarlowCondensed-OFL.txt`), ground
`#121316`, ink `#F2F2F0`, accent `#D8622E` for the slash only (words are never orange). The header
uses `wordmark-on-dark.svg` and the footer `wordmark-on-light.svg` (the transparent wordmarks with the
viewBox cropped to the letters). Site icons and the default Open Graph card are in
`public/`; the card's master is `src/assets/brand/og-default.svg`, rendered with `src/lib/og.ts`.
`src/styles/tokens.css` maps the brand colors to the site tokens.

## Analytics and third-party scripts

Vercel Web Analytics is the only analytics. It is rendered once, in `src/layouts/Base.astro`,
and loads its script from the site's own `/_vercel/insights/` path. No other analytics or
third-party scripts are allowed. `npm run prelaunch` fails if any built page has a
`<script src>` pointing anywhere but the site itself.

## Site config

`src/config/site.ts` holds the site URL (`https://www.pageteardown.com`), contact address,
email provider and indexing switch. `astro.config.mjs`, every page, the footer, the privacy page,
robots.txt, OG images and the prelaunch check read from it. Markdown pages use `{contactEmail}`
and `{emailProvider}` tokens, filled in from the config at build.

## Open Graph images

Every page uses the static `public/og-default.png` unless it passes its own `ogImage`.
`src/lib/og.ts` renders per-page 1200x630 cards at build time (satori + resvg, Barlow Condensed and IBM
Plex Mono): every scorecard gets one at `/og/page/<id>.png`.

## The board

One file per night, `src/content/scoreboard/YYYY-MM-DD.md`, in the shape `docs/CONTENT-CONTRACT.md`
describes. The rubric is `docs/rubric/page-teardown-rubric-v1-2026-10-31.md`; the methodology page reads
its dimension questions, anchors and rules from that file, so they are written nowhere else.

| Page | What it shows |
|---|---|
| `/` | The newest night: four stats, best and worst, every page ranked, legend, not captured |
| `/board/<vertical>/<kind>/` | The same night under one filter. The filter chips link here, so they work without JS; with JS they filter in place (`src/scripts/scoreboard-filter.ts`). Always noindex |
| `/page/<date>-<brand>-home/` | One homepage on one night: verdict, screenshot, details, eight dimensions, checks |
| `/brand/<slug>/` | A brand's last 30 nights, with the nights it was not captured |
| `/methodology/` | The rubric, read from the markdown |

`RUBRIC_VERSION` and `RUBRIC_TAG` are in `src/config/rubric.ts`. While the version says `draft`, every
board page is noindex and out of the sitemap; prelaunch checks it.

### Fixtures

`tests/fixtures/scoreboard/` holds three placeholder nights (Brand A to Brand T, all marked
"(placeholder)", with the PLACEHOLDER screenshots in `public/shots/fixtures/`, made by
`node scripts/fixture-shots.ts`). They load instead of `src/content/scoreboard/` with
`npm run dev:fixtures` or `PT_FIXTURES=1 npm run build`, and on Vercel preview builds
(`VERCEL_ENV=preview`). Never in production: a production build ignores them and fails if
`PT_FIXTURES=1` is set (`src/config/board.ts`). Every page of a fixture build carries a banner, and
prelaunch fails a build with fixture content in it.

## Seeded from the email site

Now page-shaped: the rubric keys and the homepage kinds (`src/config/rubric.ts`), the verticals
(`src/config/verticals.ts`, which replaced the email industries), the night and page schemas
(`src/lib/schemas.ts`), scoring and ranking (`src/lib/scoring.ts`), the board (`Scoreboard`,
`PageMiniCard`, `src/scripts/scoreboard-filter.ts`), `HowScoresCard` and the public check names
(`src/lib/checks.ts`). The email fields (subject, preheader, themes), the campaign, welcome and
transactional kinds, and `EmailMiniCard` are gone. There are no teardown or tracker pages.

Generic and kept as they were: `ScoreBadge`, `Pips`, `SignupForm`, `SignupCard`, `src/lib/dates.ts`,
`src/lib/og.ts`, `src/lib/site-tokens.ts`.

The signup forms post to `PUBLIC_SIGNUP_ENDPOINT`. While it is unset they render disabled, with a
note to email the contact address instead, and nothing is sent.

## Watchlist waitlist

`/watchlist/` collects waitlist signups for the paid plan.

The form posts to the `pageteardown-signup` Supabase edge function
(`supabase/functions/pageteardown-signup/`), which writes `pageteardown_signups`
(`supabase/migrations/`). Both live in the shared content-pipeline project
(`fpqyuzkrshokqxtjtffi`), apart from Inbox Teardown's and Social Teardown's tables, and every row
has `list = 'page-watchlist'`. `PUBLIC_SIGNUP_ENDPOINT` is
`https://fpqyuzkrshokqxtjtffi.supabase.co/functions/v1/pageteardown-signup`, and that origin is
the one `form-action` allows in `vercel.json`.

Deploy the function with `supabase functions deploy pageteardown-signup --no-verify-jwt` and
apply migrations before any function change that needs them.

## Commands

Requires Node 24 (the version CI, Vercel and the nightly publisher run).

| Command | What it does |
|---|---|
| `npm install` | Install dependencies |
| `npm run dev` | Dev server at http://localhost:4321 |
| `npm run dev:fixtures` | Dev server on the fixture boards (`PT_FIXTURES=1`) |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serve `dist/` locally |
| `npm test` | Vitest unit tests |
| `npm run check` | `astro check` type and template diagnostics |
| `npm run prelaunch` | Launch gate over `src/` and `dist/` (run after build). Reports every failure, exits 1 if any rule fails |
| `npm run csp:hashes` | Compare inline script hashes in `dist/` with the CSP in `vercel.json` (`-- --write` adds missing ones) |
| `npm run screenshots` | Playwright screenshots into `docs/screenshots/` (run after a fixture build, `PT_FIXTURES=1 npm run build`; first time: `npx playwright install chromium`) |

## Pre-launch checklist

`npm run build && npm run prelaunch` is the checklist. It fails on:

- any third-party `<script src>` (only the site itself and Vercel's `/_vercel/insights/` path are allowed)
- an inline script the `vercel.json` CSP does not allow
- any `TODO(andrew)` in `src/`
- bracketed placeholders such as `[EMAIL PROVIDER]` in built pages
- `/privacy/` missing from the build
- `PUBLIC_SIGNUP_ENDPOINT` unset at build time (set it in the Vercel project env)
- robots.txt blocking everything (set `allowIndexing: true` in `src/config/site.ts`)
- an indexable page without an `og:image`, or one pointing at a file that isn't built
- a footer missing the contact address
- fixture content in a built page (a "Brand A" style name, a `/shots/fixtures/` screenshot or the
  fixture banner), or a "Brand A" style name in `src/content/`
- an indexable board page while `RUBRIC_VERSION` says draft

Not covered by the check:

- [ ] Enable Web Analytics for the project in the Vercel dashboard (the script 404s until it is enabled).
- [ ] After the first Vercel deploy, add the deployed analytics script's hash to `script-src` in
      `vercel.json` (`npm run csp:hashes` explains why it differs from a local build).
- [ ] Before the first board with Blob screenshots, add the Blob store's host to `img-src` in
      `vercel.json`; until then the CSP blocks them.
