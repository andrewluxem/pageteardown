// The signup function's pure checks, kept free of Deno APIs so the site's
// vitest suite can import them (tests/signup-rules.test.ts).

export const ALLOWED_ORIGINS = new Set(['https://www.pageteardown.com', 'https://pageteardown.com']);
// This project's previews only: pageteardown-<hash or git-branch>-<team>.vercel.app.
export const PREVIEW_ORIGIN = /^https:\/\/pageteardown-[a-z0-9-]+-andrewluxemcrm-projects\.vercel\.app$/;

// The Watchlist waitlist. The value says which site and list a row is for,
// so it never reads as another site's signup even outside this table.
export const LISTS = new Set(['page-watchlist']);

// Deliberately loose: one @, no spaces, a dot in the domain. Typos beyond that
// are the visitor's to fix; the browser's type=email check runs first anyway.
export const EMAIL = /^[^\s@]{1,64}@[^\s@.]+(\.[^\s@.]+)+$/;

export function isAllowed(origin: string | null): origin is string {
  return !!origin && (ALLOWED_ORIGINS.has(origin) || PREVIEW_ORIGIN.test(origin));
}

/** A same-site path such as /watchlist/, or null. No //host, no query. */
export function sitePath(v: string | null): string | null {
  if (!v || v.length > 512 || !/^\/(?!\/)[A-Za-z0-9\-._~\/]*$/.test(v)) return null;
  return v;
}
