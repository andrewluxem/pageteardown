# Page Teardown

The public site for [pageteardown.com](https://www.pageteardown.com). Until the first board
ships it is a "launching soon" holding page, a privacy page and a 404.

Seeded from socialteardown (itself seeded from the sibling email teardown site), so the stack, tokens and checks match it. The board's
components are kept for reuse; the data loaders and pages that only made sense for email were
removed. See "Seeded from the email site" below for what is still email-shaped.

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
Plex Mono) for the board's pages once they exist.

## Seeded from the email site

Kept for the daily board, still typed to the email contract until the homepage capture contract exists:

- `src/components/Scoreboard.astro`, `src/scripts/scoreboard-filter.ts`,
  `src/components/EmailMiniCard.astro`, `src/components/HowScoresCard.astro`
- `src/lib/schemas.ts` (scoreboard and email schemas), `src/lib/scoring.ts`
- `src/config/rubric.ts` (email rubric v1 keys and names; the page rubric keeps the same
  mechanics: 8 dimensions, 1 to 5, 8 to 40, same bands)

Generic and ready: `ScoreBadge`, `Legend`, `Pips`, `SignupForm`, `SignupCard`, `src/lib/dates.ts`,
`src/lib/og.ts`, `src/lib/site-tokens.ts`, `src/config/industries.ts` (shared registry keys).

The signup forms post to `PUBLIC_SIGNUP_ENDPOINT`. While it is unset they show "Signups open
soon" and nothing is sent.

## Commands

Requires Node 22+.

| Command | What it does |
|---|---|
| `npm install` | Install dependencies |
| `npm run dev` | Dev server at http://localhost:4321 |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serve `dist/` locally |
| `npm test` | Vitest unit tests |
| `npm run check` | `astro check` type and template diagnostics |
| `npm run prelaunch` | Launch gate over `src/` and `dist/` (run after build). Reports every failure, exits 1 if any rule fails |
| `npm run csp:hashes` | Compare inline script hashes in `dist/` with the CSP in `vercel.json` (`-- --write` adds missing ones) |
| `npm run screenshots` | Playwright screenshots into `docs/screenshots/` (run after build; first time: `npx playwright install chromium`) |

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

Not covered by the check:

- [ ] Enable Web Analytics for the project in the Vercel dashboard (the script 404s until it is enabled).
- [ ] After the first Vercel deploy, add the deployed analytics script's hash to `script-src` in
      `vercel.json` (`npm run csp:hashes` explains why it differs from a local build).
