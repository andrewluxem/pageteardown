// Single source for site-wide facts. Pages, the footer, the privacy page,
// astro.config.mjs, robots.txt, OG images, and the prelaunch check all read
// from here. Keep it free of import.meta.env so plain Node can import it.
export const SITE = {
  name: 'Page Teardown',
  siteUrl: 'https://www.pageteardown.com',
  contactEmail: 'support@pageteardown.com',
  // Where signups are stored: the provider's display name as a plain string
  // (no link; the privacy page links to its policy separately).
  // The privacy page's "Signups are stored by {emailProvider}" renders it
  // (src/lib/site-tokens.ts). Null renders [EMAIL PROVIDER], which fails
  // prelaunch's placeholder rule.
  // Not related: signup forms post to PUBLIC_SIGNUP_ENDPOINT (Vercel env),
  // which must be set separately.
  emailProvider: 'Supabase' as string | null,
  // Must be: true at launch, and only then.
  // When true: /robots.txt becomes "User-agent: * / Allow: /" plus the
  // sitemap URL (src/pages/robots.txt.ts), and prelaunch's robots rule
  // passes. While false, robots.txt disallows everything for every crawler.
  // It changes nothing else: per-page noindex (drafts,
  // signups-soon, signed-up) and the sitemap filter work either way.
  allowIndexing: true,
  description: 'Retail homepages, scored on a public rubric for what a first-time visitor sees on a phone. Launching soon.',
  // The home page's title after the site name.
  tagline: 'Retail homepages, scored',
  timezone: 'America/Denver',
  timezoneLabel: 'MT',
  // The planned monthly price as display text, shown as is on /watchlist/
  // (src/pages/watchlist.astro) with "Planned launch price..." under it;
  // nothing else reads it.
  watchlistPrice: '$39/mo',
};

export const SITE_HOST = new URL(SITE.siteUrl).host;

export function mailto(subject?: string): string {
  return `mailto:${SITE.contactEmail}${subject ? `?subject=${encodeURIComponent(subject)}` : ''}`;
}
