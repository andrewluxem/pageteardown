import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import type { Dimensions, Homepage, ScoreboardNight } from '../src/lib/schemas';
import { DIMENSION_KEYS, type DimensionKey } from '../src/config/rubric';
import { FIXTURE_DIR } from '../src/config/board';

export const ROOT = join(import.meta.dirname, '..');

/** Build a dimensions object with every score set to `base`, then apply overrides. */
export function dims(base: number, overrides: Partial<Record<DimensionKey, number>> = {}): Dimensions {
  return Object.fromEntries(
    DIMENSION_KEYS.map((k) => [k, { score: overrides[k] ?? base, note: 'n', source: 'judgment' as const }]),
  ) as Dimensions;
}

let n = 0;
export function makePage(partial: Partial<Homepage> & { dimensions: Dimensions }): Homepage {
  n++;
  return {
    id: `2026-10-30-brand-${n}-home`,
    brand: `Brand ${n}`,
    brand_slug: `brand-${n}`,
    vertical: 'other',
    homepage_kind: 'storefront',
    url: `https://www.brand-${n}.example/`,
    captured_at: new Date('2026-10-31T04:20:00Z'),
    hero_headline: 'Headline',
    primary_cta: { text: 'Shop now' },
    checks: [],
    screenshot: null,
    ...partial,
  };
}

/** A board night holding these pages, with ids made to match the date. */
export function night(date: string, pages: Homepage[], notCaptured: ScoreboardNight['not_captured'] = []): ScoreboardNight {
  return {
    date,
    generated_at: new Date(`${date}T13:00:00Z`),
    rubric_version: '1.0-draft',
    pages: pages.map((p) => ({ ...p, id: `${date}-${p.brand_slug}-home` })),
    not_captured: notCaptured,
  };
}

/** Parse the YAML frontmatter of a markdown file. */
export function frontmatter(path: string): unknown {
  const src = readFileSync(path, 'utf8');
  const m = src.match(/^---\n([\s\S]*?)\n---/);
  if (!m) throw new Error(`No frontmatter in ${path}`);
  return parse(m[1]!);
}

/** The fixture board files, by filename. */
export function fixtureFiles(): string[] {
  return readdirSync(join(ROOT, FIXTURE_DIR)).filter((f) => f.endsWith('.md')).sort();
}

export function fixture(file: string): unknown {
  return frontmatter(join(ROOT, FIXTURE_DIR, file));
}
