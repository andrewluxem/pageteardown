// Zod schemas for content: the nightly board (docs/CONTENT-CONTRACT.md) and the
// markdown pages. Kept free of astro:content imports so Vitest can validate
// fixtures directly.
import { z } from 'astro/zod';
import { CAPPING_DIMENSIONS, HOMEPAGE_KIND_KEYS, SCORE_MAX, SCORE_MIN } from '../config/rubric';
import { VERTICAL_KEYS } from '../config/verticals';

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Public host of the Vercel Blob store that holds screenshots
 * (pageteardown-shots). vercel.json's img-src allows exactly this host, so a
 * URL from any other store would render as a broken image; the schema refuses
 * it instead. tests/csp.test.ts keeps the two in step.
 */
export const BLOB_HOST = 'jvx7f1mxqao2jbqs.public.blob.vercel-storage.com';

/**
 * A screenshot reference: a path under /shots/ (fixtures, files in
 * public/shots/) or an https URL on the site's Blob store (BLOB_HOST) with
 * no credentials, port or empty path. Any other URL is refused, including
 * one from another Blob store.
 */
export function isScreenshotRef(v: string): boolean {
  if (!v || /\s/.test(v)) return false;
  if (/^\/shots\/\S+$/.test(v)) return true;
  let u: URL;
  try {
    u = new URL(v);
  } catch {
    return false;
  }
  return (
    u.protocol === 'https:' &&
    u.hostname === BLOB_HOST &&
    !u.username &&
    !u.password &&
    u.port === '' &&
    u.pathname.length > 1
  );
}

/**
 * A not-captured reason must be public wording: a sentence ("The site blocked
 * our capture browser."), never an internal code such as `bot_wall` or
 * `HTTP_403`.
 */
export function isPublicReason(v: string): boolean {
  const s = v.trim();
  return /^[A-Z]/.test(s) && /\.$/.test(s) && !s.includes('_') && s.split(/\s+/).length >= 3;
}

/**
 * YAML parses unquoted `2026-10-07` as a Date at UTC midnight. Normalize to a
 * plain `YYYY-MM-DD` string so calendar dates never drift across time zones.
 */
export const isoDate = z.preprocess(
  (v) => (v instanceof Date ? v.toISOString().slice(0, 10) : v),
  z.string().regex(DATE, 'Expected a YYYY-MM-DD date'),
);

/** Full timestamps (ISO 8601 with offset). */
export const isoDateTime = z.coerce.date();

export const verticalSchema = z.enum(VERTICAL_KEYS);
export const homepageKindSchema = z.enum(HOMEPAGE_KIND_KEYS);

export const dimensionSchema = z.strictObject({
  score: z.number().int().min(SCORE_MIN).max(SCORE_MAX),
  note: z.string().min(1),
  source: z.enum(['check', 'judgment', 'both']),
});

// strictObject: a missing OR an unknown dimension fails the build.
export const dimensionsSchema = z.strictObject({
  headline: dimensionSchema,
  value: dimensionSchema,
  hierarchy: dimensionSchema,
  copy: dimensionSchema,
  cta: dimensionSchema,
  relevance: dimensionSchema,
  trust: dimensionSchema,
  hygiene: dimensionSchema,
});

export const checkSchema = z.strictObject({
  // A public name from src/lib/checks.ts, never a scorer check_id.
  name: z.string().min(1),
  // unverified: the check could not reach a verdict (403, 429, timeout, a
  // footer rendered as an image). Rubric v1 never penalizes it, so it renders
  // neutral.
  result: z.enum(['pass', 'fail', 'unverified']),
  detail: z.string().optional(),
});

const homepageBase = z.strictObject({
  // <date>-<brand_slug>-home; the board checks the prefix and slug.
  id: z.string().regex(SLUG, 'id must be lowercase, URL-safe (a-z, 0-9, hyphens)'),
  brand: z.string().min(1),
  brand_slug: z.string().regex(SLUG, 'brand_slug must be lowercase, URL-safe'),
  vertical: verticalSchema,
  homepage_kind: homepageKindSchema,
  // The homepage captured, shown as text (never linked) on the scorecard.
  url: z.url({ protocol: /^https$/ }),
  captured_at: isoDateTime,
  // Null when the headline is baked into an image (no live text). Optional: a
  // board may leave it out (the exporter does in v1), and the scorecard then
  // shows no headline row.
  hero_headline: z.string().min(1).nullable().optional(),
  hero_subhead: z.string().min(1).optional(),
  // Null when no primary CTA is visible in the first screen. Optional, like
  // hero_headline: left out, the scorecard shows no CTA row.
  primary_cta: z
    .strictObject({
      text: z.string().min(1),
      href: z.string().min(1).optional(),
    })
    .nullable()
    .optional(),
  dimensions: dimensionsSchema,
  checks: z.array(checkSchema).default([]),
  // A local path under /shots/ or an https URL on the site's Blob store
  // (isScreenshotRef). Real screenshots go to Blob, never into git.
  screenshot: z
    .string()
    .refine(
      isScreenshotRef,
      `screenshot must be a path under /shots/ or an https URL on ${BLOB_HOST}`,
    )
    .nullable()
    .default(null),
  // The same first screen after the capture closed a full-screen popup, on a
  // page whose popup it closed; other pages leave it out. Same rule as
  // screenshot, and it needs one.
  screenshot_after_popup: z
    .string()
    .refine(
      isScreenshotRef,
      `screenshot_after_popup must be a path under /shots/ or an https URL on ${BLOB_HOST}`,
    )
    .optional(),
  // Set when a score was changed after publication; shown on the scorecard.
  correction: z
    .strictObject({
      date: isoDate,
      note: z.string().min(1),
    })
    .optional(),
});

/**
 * Hard-fail evidence gate. A 1 on a capping dimension (Trust, Technical
 * hygiene) caps the page publicly, so it must be backed by at least one
 * failed check with a non-empty detail. A cap with no evidence fails the build.
 */
export const homepageSchema = homepageBase.superRefine((p, ctx) => {
  if (p.screenshot_after_popup !== undefined && p.screenshot === null) {
    ctx.addIssue({
      code: 'custom',
      path: ['screenshot_after_popup'],
      message: 'screenshot_after_popup needs a screenshot (the first screen)',
    });
  }
  const capped = CAPPING_DIMENSIONS.filter((k) => p.dimensions[k].score === 1);
  if (!capped.length) return;
  const evidenced = p.checks.some((c) => c.result === 'fail' && (c.detail ?? '').trim().length > 0);
  if (!evidenced) {
    capped.forEach((k) =>
      ctx.addIssue({
        code: 'custom',
        path: ['dimensions', k, 'score'],
        message: `${k} is 1 (capped) but no failed check with a detail backs it`,
      }),
    );
  }
});

export const notCapturedSchema = z.strictObject({
  brand: z.string().min(1),
  brand_slug: z.string().regex(SLUG, 'brand_slug must be lowercase, URL-safe'),
  vertical: verticalSchema,
  reason: z
    .string()
    .refine(isPublicReason, 'reason must be public wording (a sentence ending in a period), not an internal code'),
});

/**
 * A brand whose page was captured and scored but is held for review (a check
 * waiting on its ceiling review). The site shows HELD_REASON for it; the board
 * carries no wording of its own.
 */
export const heldSchema = z.strictObject({
  brand: z.string().min(1),
  brand_slug: z.string().regex(SLUG, 'brand_slug must be lowercase, URL-safe'),
  vertical: verticalSchema,
});

export const scoreboardSchema = z
  .strictObject({
    // The night the homepages were captured; the filename must match it.
    date: isoDate,
    generated_at: isoDateTime,
    // Quoted in YAML, or it parses as a number and fails here.
    rubric_version: z.string().min(1),
    pages: z.array(homepageSchema).min(1),
    not_captured: z.array(notCapturedSchema).default([]),
    held: z.array(heldSchema).default([]),
  })
  .superRefine((night, ctx) => {
    const ids = new Set<string>();
    const scored = new Set<string>();
    night.pages.forEach((p, i) => {
      if (ids.has(p.id)) {
        ctx.addIssue({ code: 'custom', path: ['pages', i, 'id'], message: `Duplicate page id "${p.id}"` });
      }
      ids.add(p.id);
      const want = `${night.date}-${p.brand_slug}-home`;
      if (p.id !== want) {
        ctx.addIssue({ code: 'custom', path: ['pages', i, 'id'], message: `id "${p.id}" must be "${want}" (<date>-<brand_slug>-home)` });
      }
      scored.add(p.brand_slug);
    });
    const missed = new Set<string>();
    night.not_captured.forEach((n, i) => {
      if (scored.has(n.brand_slug)) {
        ctx.addIssue({
          code: 'custom',
          path: ['not_captured', i, 'brand_slug'],
          message: `brand_slug "${n.brand_slug}" is in both pages and not_captured`,
        });
      }
      if (missed.has(n.brand_slug)) {
        ctx.addIssue({ code: 'custom', path: ['not_captured', i, 'brand_slug'], message: `Duplicate not_captured brand_slug "${n.brand_slug}"` });
      }
      missed.add(n.brand_slug);
    });
    const held = new Set<string>();
    night.held.forEach((h, i) => {
      const where = scored.has(h.brand_slug) ? 'pages' : missed.has(h.brand_slug) ? 'not_captured' : null;
      if (where) {
        ctx.addIssue({ code: 'custom', path: ['held', i, 'brand_slug'], message: `brand_slug "${h.brand_slug}" is in both ${where} and held` });
      }
      if (held.has(h.brand_slug)) {
        ctx.addIssue({ code: 'custom', path: ['held', i, 'brand_slug'], message: `Duplicate held brand_slug "${h.brand_slug}"` });
      }
      held.add(h.brand_slug);
    });
  });

export const pageSchema = z.strictObject({
  title: z.string().min(1),
  description: z.string().min(1),
});

export type Homepage = z.infer<typeof homepageSchema>;
export type NotCaptured = z.infer<typeof notCapturedSchema>;
export type Held = z.infer<typeof heldSchema>;
export type ScoreboardNight = z.infer<typeof scoreboardSchema>;
export type Dimensions = z.infer<typeof dimensionsSchema>;
export type CheckResult = z.infer<typeof checkSchema>['result'];
