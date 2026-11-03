// Everything derived from dimension scores. None of these values are stored in
// content; the pipeline writes raw dimension scores only.
import { BANDS, CAPPING_DIMENSIONS, DIMENSION_KEYS, type Band, type DimensionKey } from '../config/rubric';
import type { Dimensions } from './schemas';

type HasDimensions = { dimensions: Dimensions };

export function total(p: HasDimensions): number {
  return DIMENSION_KEYS.reduce((sum, k) => sum + p.dimensions[k].score, 0);
}

export function isCapped(p: HasDimensions): boolean {
  return CAPPING_DIMENSIONS.some((k) => p.dimensions[k].score === 1);
}

export function bandFor(totalScore: number, capped: boolean): Band {
  if (capped) return 'capped';
  if (totalScore >= BANDS.strong.min) return 'strong';
  if (totalScore >= BANDS.solid.min) return 'solid';
  return 'weak';
}

export function band(p: HasDimensions): Band {
  return bandFor(total(p), isCapped(p));
}

/** The dimension that dragged the page down most; ties go to rubric order. */
export function lowestDimension(p: HasDimensions): DimensionKey {
  return DIMENSION_KEYS.reduce((lo, k) => (p.dimensions[k].score < p.dimensions[lo].score ? k : lo));
}

/** The dimension responsible for a cap, if any (trust before hygiene). */
export function cappingDimension(p: HasDimensions): DimensionKey | undefined {
  return CAPPING_DIMENSIONS.find((k) => p.dimensions[k].score === 1);
}

export interface Scored<T> {
  page: T;
  total: number;
  capped: boolean;
  band: Band;
}

export function score<T extends HasDimensions>(p: T): Scored<T> {
  const t = total(p);
  const capped = isCapped(p);
  return { page: p, total: t, capped, band: bandFor(t, capped) };
}

/**
 * Board order: every uncapped page first by total descending, then capped
 * pages by total descending. Ties break on brand, then id, so the order is
 * stable across builds.
 */
export function rank<T extends HasDimensions & { brand: string; id: string }>(pages: T[]): Scored<T>[] {
  return pages.map(score).sort((a, b) => {
    if (a.capped !== b.capped) return a.capped ? 1 : -1;
    if (a.total !== b.total) return b.total - a.total;
    return a.page.brand.localeCompare(b.page.brand) || a.page.id.localeCompare(b.page.id);
  });
}

export interface BestWorst<T> {
  best?: Scored<T>;
  worst?: Scored<T>;
  worstIsCap: boolean;
}

/**
 * Over every captured page (there is no kind to leave out). Best: the top
 * uncapped page. Worst: the first capped page in board order, or failing that
 * the lowest uncapped page, when there are at least two.
 */
export function bestAndWorst<T extends HasDimensions & { brand: string; id: string }>(pages: T[]): BestWorst<T> {
  const ranked = rank(pages);
  const uncapped = ranked.filter((s) => !s.capped);
  const best = uncapped[0];
  const cap = ranked.find((s) => s.capped);
  if (cap) return { best, worst: cap, worstIsCap: true };
  return { best, worst: uncapped.length > 1 ? uncapped.at(-1) : undefined, worstIsCap: false };
}

export function average(nums: number[]): number {
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
}
