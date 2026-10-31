// Page Teardown rubric v1 (docs/rubric/page-teardown-rubric-v1-2026-10-31.md).
// Keys are the rubric's slugs and part of the content contract; they must not
// change. Display names may. Dimension questions and anchors live only in the
// rubric markdown; the methodology page reads them from there.
export const DIMENSIONS = {
  headline: 'Headline',
  value: 'Value & differentiation',
  hierarchy: 'Design & hierarchy',
  copy: 'Copy & voice',
  cta: 'Call to action',
  relevance: 'Relevance',
  trust: 'Trust',
  hygiene: 'Technical hygiene',
} as const;

export type DimensionKey = keyof typeof DIMENSIONS;

export const DIMENSION_KEYS = Object.keys(DIMENSIONS) as DimensionKey[];

/** A score of 1 on any of these caps the page regardless of its total. */
export const CAPPING_DIMENSIONS: readonly DimensionKey[] = ['trust', 'hygiene'];

export const SCORE_MIN = 1;
export const SCORE_MAX = 5;
export const TOTAL_MAX = DIMENSION_KEYS.length * SCORE_MAX;

export const BANDS = {
  strong: { label: 'Strong', range: '33 to 40', min: 33 },
  solid: { label: 'Solid', range: '24 to 32', min: 24 },
  weak: { label: 'Weak', range: 'under 24', min: 0 },
  capped: { label: 'Capped', range: 'a 1 on Trust or Technical hygiene', min: 0 },
} as const;

export type Band = keyof typeof BANDS;

// The rubric's Choice question for homepage kind. Routes and filters the
// board; never scored.
export const HOMEPAGE_KINDS = {
  storefront: 'Storefront',
  product: 'Product-led',
  editorial: 'Editorial',
  other: 'Other',
} as const;

export type HomepageKind = keyof typeof HOMEPAGE_KINDS;

export const HOMEPAGE_KIND_KEYS = Object.keys(HOMEPAGE_KINDS) as [HomepageKind, ...HomepageKind[]];

/**
 * The rubric version this site describes. "draft" until Andrew approves the
 * rubric markdown as v1.0; while it says draft, every board page is noindex
 * (Base.astro, and prelaunch checks it).
 */
export const RUBRIC_VERSION = '1.0-draft';
export const RUBRIC_IS_DRAFT = RUBRIC_VERSION.includes('draft');

/** Shown wherever the board names its rubric. Read it from here only. */
export const RUBRIC_TAG = 'rubric v1.0, pre-calibration';

/** The rubric markdown, relative to the repo root. */
export const RUBRIC_DOC = 'docs/rubric/page-teardown-rubric-v1-2026-10-31.md';
